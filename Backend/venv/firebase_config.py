import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Get the directory where this file is located
current_dir = os.path.dirname(os.path.abspath(__file__))
service_account_path = os.path.join(current_dir, "serviceAccountKey.json")

# Initialize Firebase Admin
cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()