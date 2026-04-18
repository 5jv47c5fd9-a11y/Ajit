package ai.outsight.app.push

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class OutsightMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        Log.i("OutsightFCM", "new token: $token")
        // TODO: forward to backend via OutsightClient.subscribe(null, token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        Log.i("OutsightFCM", "alert: ${message.data}")
    }
}
