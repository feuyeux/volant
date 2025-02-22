use langchain_rust::chain::{Chain, LLMChainBuilder};
use langchain_rust::llm::client::Ollama;
use langchain_rust::prompt::HumanMessagePromptTemplate;
use langchain_rust::schemas::Message;
use langchain_rust::{fmt_message, fmt_template, message_formatter, prompt_args, template_fstring};
use std::sync::Arc;
use tokio::sync::Mutex;

lazy_static::lazy_static! {
    static ref CHAIN: Arc<Mutex<dyn Chain>> = {
        let ollama = Ollama::default().with_model("mistral-nemo");
        let prompt = message_formatter![
            fmt_message!(Message::new_system_message(
                "根据{sentence}的内容，翻译成英语、法语、俄语、日语。翻译过程要考虑文学修辞和意境表达，做到信达雅。
                输出语言名称和翻译结果。

                输出格式：
                英语：{en}
                法语：{fr}
                俄语：{ru}
                日语：{ja}"
            )),
            fmt_template!(HumanMessagePromptTemplate::new(template_fstring!(
                "{sentence}",
                "sentence"
            ))),
        ];
        let chain = LLMChainBuilder::new()
            .prompt(prompt)
            .llm(ollama.clone())
            .build()
            .unwrap();
        Arc::new(Mutex::new(chain))
    };
}

#[tauri::command]
async fn translate(sentence: String) -> String {
    let chain = CHAIN.lock().await;
    chain
        .invoke(prompt_args! {"sentence" => sentence})
        .await
        .unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![translate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}