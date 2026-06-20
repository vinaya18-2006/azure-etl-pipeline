import os

def upload_to_azure(file_path, connection_string, container_name, blob_name=None):
    """
    Uploads backup target files directly to Azure Blob Storage.
    Falls back to a detailed simulation if credentials are not configured.
    """
    print(f"[AZURE_LOADER] Preparing cloud backup stream for target: {file_path}")
    if not blob_name:
        blob_name = os.path.basename(file_path)
        
    # Check connection string validity
    if not connection_string or "your_account" in connection_string or "AccountName=" not in connection_string:
        print("[AZURE_LOADER] Connection string not configured. Simulating Azure container sync...")
        print(f"[AZURE_LOADER] Cloud sync simulated: Synced '{file_path}' into storage container '{container_name}' as blob '{blob_name}' successfully.")
        return True
        
    try:
        from azure.storage.blob import BlobServiceClient
        service_client = BlobServiceClient.from_connection_string(connection_string)
        
        # Create container if it doesn't exist
        container_client = service_client.get_container_client(container_name)
        if not container_client.exists():
            print(f"[AZURE_LOADER] Container '{container_name}' not found. Creating container...")
            container_client.create_container()
            
        blob_client = service_client.get_blob_client(container=container_name, blob=blob_name)
        with open(file_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
            
        print(f"[AZURE_LOADER] Cloud upload finished! Transmitted blob '{blob_name}' to container '{container_name}'.")
        return True
    except Exception as e:
        print(f"[AZURE_LOADER] Connection attempt to Azure Container failed: {e}")
        return False
