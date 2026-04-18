package ai.outsight.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.outsight.app.api.OutsightClient
import kotlinx.coroutines.launch

@Composable
fun CompareScreen() {
    var input by remember { mutableStateOf("Shopify, Acme, Netflix") }
    var rows by remember { mutableStateOf<List<OutsightClient.ComparisonRow>>(emptyList()) }
    val scope = rememberCoroutineScope()

    Column(Modifier.padding(16.dp)) {
        OutlinedTextField(value = input, onValueChange = { input = it }, label = { Text("Companies (comma separated)") }, modifier = Modifier.fillMaxWidth())
        Button(onClick = {
            scope.launch {
                val list = input.split(',').map { it.trim() }.filter { it.isNotEmpty() }
                runCatching { OutsightClient.compare(list) }.onSuccess { rows = it }
            }
        }, modifier = Modifier.padding(top = 8.dp)) { Text("Compare") }

        LazyColumn(Modifier.padding(top = 12.dp)) {
            items(rows) { r ->
                ListItem(
                    headlineContent = { Text(r.company) },
                    supportingContent = {
                        Text("Automation ${r.automation_readiness_score} • AI ${r.ai_adoption_probability} • Win ${r.vendor_win_probability}% • Deal 12m ${r.deal_probability_12m}%")
                    }
                )
                Divider()
            }
        }
    }
}
