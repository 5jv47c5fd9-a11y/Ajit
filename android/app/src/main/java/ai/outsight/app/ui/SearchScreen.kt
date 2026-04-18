package ai.outsight.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.outsight.app.api.IntelligencePayload
import ai.outsight.app.api.OutsightClient
import kotlinx.coroutines.launch

@Composable
fun SearchScreen(onOpen: (String) -> Unit) {
    var company by remember { mutableStateOf("") }
    var executive by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var payload by remember { mutableStateOf<IntelligencePayload?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState())) {
        Text("Outsight AI", style = MaterialTheme.typography.headlineLarge)
        Text("Executive enterprise intelligence", style = MaterialTheme.typography.bodyMedium)

        OutlinedTextField(
            value = company,
            onValueChange = { company = it },
            label = { Text("Company") },
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
        )

        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Switch(checked = executive, onCheckedChange = { executive = it })
            Spacer(Modifier.width(8.dp))
            Text("Executive Mode")
        }

        Button(
            onClick = {
                scope.launch {
                    loading = true
                    error = null
                    runCatching { OutsightClient.intelligence(company, executive) }
                        .onSuccess { payload = it }
                        .onFailure { error = it.message }
                    loading = false
                }
            },
            enabled = company.isNotBlank() && !loading,
            modifier = Modifier.padding(top = 8.dp)
        ) { Text(if (loading) "Analyzing…" else "Analyze") }

        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        payload?.let { IntelligenceDetail(company, it, onAdded = { onOpen(company) }) }
    }
}
