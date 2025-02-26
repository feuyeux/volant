// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let platform = tauri_plugin_os::platform();
    println!("Platform: {}", platform);
    volant_lib::run()
}
