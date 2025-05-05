import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase Admin
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# Firestore Database
db = firestore.client()