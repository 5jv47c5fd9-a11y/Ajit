package ai.outsight.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.outsight.app.api.AlertItem
import ai.outsight.app.api.OutsightClient
import kotlinx.coroutines.launch

@Composable
fun AlertsScreen() {
    var alerts by remember { mutableStateOf<List<AlertItem>>(emptyList()) }
    var email by remember { mutableStateOf("") }
    var token by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        runCatching { OutsightClient.alerts() }.onSuccess { alerts = it }
    }

    Column(Modifier.padding(16.dp)) {
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = token, onValueChange = { token = it }, label = { Text("Push token") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
        Button(onClick = {
            scope.launch { runCatching { OutsightClient.subscribe(email.ifBlank { null }, token.ifBlank { null }) } }
        }, modifier = Modifier.padding(top = 8.dp)) { Text("Save Subscription") }

        Divider(Modifier.padding(vertical = 12.dp))
        Text("Recent Alerts", style = MaterialTheme.typography.titleMedium)
        LazyColumn {
            items(alerts) { a ->
                ListItem(
                    headlineContent = { Text(a.kind.replace('_', ' ')) },
                    supportingContent = { Text(a.message) },
                    trailingContent = { Text(a.severity) }
                )
                Divider()
            }
        }
    }
}
