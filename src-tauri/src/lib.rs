use env_logger::Builder;
use langchain_rust::chain::{Chain, LLMChainBuilder};
use langchain_rust::llm::client::Ollama;
use langchain_rust::prompt::HumanMessagePromptTemplate;
use langchain_rust::schemas::Message;
use langchain_rust::{fmt_message, fmt_template, message_formatter, prompt_args, template_fstring};
use log::LevelFilter;
use std::sync::Arc;
use tokio::sync::Mutex;

fn init_logger() {
    let mut builder = Builder::from_default_env();
    // Ignore the error if the logger is already initialized.
    let _ = builder.filter(None, LevelFilter::Debug).try_init();
}

lazy_static::lazy_static! {
    static ref CHAIN: Arc<Mutex<dyn Chain>> = {
        let model_name = "mistral-nemo";
        // let model_name = "llama3.2";
        let ollama = Ollama::default().with_model(model_name);
    let prompt = message_formatter![
        fmt_message!(Message::new_system_message("将句子从一种语言翻译为另一种语言。仅仅输出翻译后的句子，不输出其他内容。")),
        fmt_template!(HumanMessagePromptTemplate::new(template_fstring!(
            "将 {sentence} 从{slang}翻译成{tlang}","sentence",  "slang", "tlang"
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
async fn translate(sentence: String, source_language: String, target_language: String) -> String {
    init_logger();
    let chain = CHAIN.lock().await;
    let input_variables = prompt_args! {
        "sentence" => sentence,
        "slang" => source_language,
        "tlang" => target_language,
    };
    chain.invoke(input_variables).await.unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![translate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
