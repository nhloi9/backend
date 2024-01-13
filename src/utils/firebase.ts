import * as admin from 'firebase-admin'
import { getStorage } from 'firebase-admin/storage'
import serviceAccount from '../configs/firebase-adminsdk.json'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: 'gs://netflix-fba01.appspot.com'
})
const bucket = getStorage().bucket()

export { bucket }
