use bitcoincore_rpc::{Auth, Client, RpcApi};
use tokio_postgres::{NoTls, Error};
use dotenv::dotenv;
use reqwest::Client as rClient;
use serde_json::Value;

// Function to connect to the PostgreSQL database
async fn connect_to_db() -> Result<tokio_postgres::Client, Error> {
    dotenv().ok();
    // Define your PostgreSQL connection string
    let connection_string = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to PostgreSQL
    let (client, connection) = tokio_postgres::connect(&connection_string, NoTls).await?;

    // Spawn the connection in the background
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Database connection error: {}", e);
        }
    });

    Ok(client)
}

// // Function to connect to Bitcoin Core node
// fn connect_to_bitcoin() -> Result<Client, bitcoincore_rpc::Error> {
//     let rpc_url = "http://localhost:8332";
//     let rpc_auth = Auth::UserPass("your_rpc_user".to_string(), "your_rpc_password".to_string());
//     let client = Client::new(rpc_url, rpc_auth)?;

//     Ok(client)
// }

// Function to insert block data into the database
async fn insert_block_data(client: &tokio_postgres::Client, block_height: u64, block_hash: &str, block_time: i64) -> Result<(), Error> {
    client
        .execute(
            "INSERT INTO blocks (block_height, block_hash, block_time) VALUES ($1, $2, $3)",
            &[&(block_height as i64), &block_hash, &block_time],
        )
        .await?;

    Ok(())
}

// Function to insert transaction data into the database
async fn insert_transaction_data(client: &tokio_postgres::Client, txid: &str, block_hash: &str, value: i64, fee: i64) -> Result<(), Error> {
    client
        .execute(
            "INSERT INTO transactions (txid, block_hash, value, fee) VALUES ($1, $2, $3, $4)",
            &[&txid, &block_hash, &value, &fee],
        )
        .await?;

    Ok(())
}

// Function to insert address and output data into the database
async fn insert_address_data(client: &tokio_postgres::Client, txid: &str, address: &str, value: i64) -> Result<(), Error> {
    client
        .execute(
            "INSERT INTO outputs (txid, address, value) VALUES ($1, $2, $3)",
            &[&txid, &address, &value],
        )
        .await?;

    Ok(())
}

// Function to connect to BlockCypher
async fn connect_to_blockcypher() -> Result<rClient, reqwest::Error> {
    let client = rClient::new();
    Ok(client)
}

// Function to fetch the latest block details from BlockCypher
async fn fetch_latest_block(client: &rClient, token: &str) -> Result<Value, reqwest::Error> {
    let url = format!("https://api.blockcypher.com/v1/btc/main?token={}", token);
    let response = client.get(&url).send().await?.json().await?;
    Ok(response)
}

// Function to fetch transactions for a specific block
async fn fetch_block_transactions(client: &rClient, block_hash: &str, token: &str) -> Result<Value, reqwest::Error> {
    let url = format!("https://api.blockcypher.com/v1/btc/blocks/{}?token={}", block_hash, token);
    let response = client.get(&url).send().await?.json().await?;
    Ok(response)
}

// Main function to ingest on-chain data
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let token = std::env::var("BLOCKCYPHER_TOKEN").expect("BLOCKCYPHER_TOKEN must be set");

    // Connect to the PostgreSQL database
    let db_client = connect_to_db().await?;

    // Connect to BlockCypher
    let client = connect_to_blockcypher().await?;

    // Fetch the latest block details
    let latest_block = fetch_latest_block(&client, &token).await?;

    // log latest block to console
    println!("{:?}", latest_block);

    let block_height = latest_block["height"].as_u64().unwrap();
    let block_hash = latest_block["hash"].as_str().unwrap();
    let block_time = latest_block["time"].as_str().unwrap(); // Ensure to adjust as needed

    // log all data

    println!("Block Height: {}", block_height);
    println!("Block Hash: {}", block_hash);
    println!("Block Time: {}", block_time);
    // Insert block data into the database
    insert_block_data(&db_client, block_height, block_hash, block_time.parse::<i64>().unwrap()).await?;

    // Fetch transactions for the latest block
    let block_transactions = fetch_block_transactions(&client, block_hash, &token).await?;
    
    // Process each transaction and insert data into the database
    for txid in block_transactions["txids"].as_array().unwrap() {
        let txid_str = txid.as_str().unwrap();
        // Fetch transaction details if needed
        // For example, you could call another function to get transaction details and then insert into the database
        // Assuming you have transaction value and fee (you will need to implement this based on your requirement)
        // Example:
        // let value = ...; 
        // let fee = ...;
        // insert_transaction_data(&db_client, txid_str, block_hash, value, fee).await?;
    }

    Ok(())
}
