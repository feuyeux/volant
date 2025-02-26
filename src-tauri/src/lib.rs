use env_logger::Builder;
use futures::StreamExt;
use langchain_rust::chain::{Chain, LLMChainBuilder};
use langchain_rust::llm::client::Ollama;
use langchain_rust::prompt::HumanMessagePromptTemplate;
use langchain_rust::schemas::Message;
use langchain_rust::{fmt_message, fmt_template, message_formatter, prompt_args, template_fstring};
use log::LevelFilter;
use std::sync::Arc;
use tauri::Emitter; // Changed from Manager to Emitter
use tokio::sync::Mutex;

fn init_logger() {
    let mut builder = Builder::from_default_env();
    // Ignore the error if the logger is already initialized.
    let _ = builder.filter(None, LevelFilter::Debug).try_init();
}

lazy_static::lazy_static! {
    static ref CHAIN: Arc<Mutex<dyn Chain>> = {
        //let model_name = "mistral-nemo";
        let model_name = "llama3.2";
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
    let chain = CHAIN.lock().await;
    let input_variables = prompt_args! {
        "sentence" => sentence,
        "slang" => source_language,
        "tlang" => target_language,
    };
    log::info!("translate input_variables: {:?}", input_variables);
    chain.invoke(input_variables).await.unwrap()
}

#[tauri::command]
async fn translate_stream(
    window: tauri::Window,
    sentence: String,
    source_language: String,
    target_language: String,
) -> Result<(), String> {
    let chain = CHAIN.lock().await;
    let input_variables = prompt_args! {
        "sentence" => sentence,
        "slang" => source_language,
        "tlang" => target_language,
    };
    log::info!("translate_stream input_variables: {:?}", input_variables);
    let mut stream = chain
        .stream(input_variables)
        .await
        .map_err(|e| e.to_string())?;

    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(text) => {
                let serializable_text = text.content.clone();
                window
                    .emit("translation-chunk", serializable_text)
                    .map_err(|e| e.to_string())?;
            }
            Err(e) => return Err(e.to_string()),
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_logger();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![translate, translate_stream])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
