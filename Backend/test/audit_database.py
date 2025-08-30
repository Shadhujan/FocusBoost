# audit_database.py
import firebase_admin
from firebase_admin import credentials, firestore

def audit_database():
    # Initialize Firebase (use your service account key)
    cred = credentials.Certificate('../firebase-credentials.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    # Check session_data collection
    session_docs = db.collection('session_data').limit(50).get()
    image_data_found = False
    
    for doc in session_docs:
        data = doc.to_dict()
        # Check for raw image data fields
        prohibited_fields = ['imageData', 'rawImage', 'base64Image', 'cameraFrame']
        for field in prohibited_fields:
            if field in data:
                image_data_found = True
                print(f"Raw image data found in document: {doc.id}")
                
    if not image_data_found:
        print("No raw image data found in database")
        
    return not image_data_found

# Run the audit
if __name__ == "__main__":
    result = audit_database()
    print(f"Privacy audit passed: {result}")