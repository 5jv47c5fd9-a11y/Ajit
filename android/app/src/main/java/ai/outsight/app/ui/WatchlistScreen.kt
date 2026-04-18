package ai.outsight.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.outsight.app.api.OutsightClient
import ai.outsight.app.api.WatchlistItem
import kotlinx.coroutines.launch

@Composable
fun WatchlistScreen(onOpen: (String) -> Unit) {
    var items by remember { mutableStateOf<List<WatchlistItem>>(emptyList()) }
    var company by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        runCatching { OutsightClient.watchlist() }.onSuccess { items = it }
    }

    Column(Modifier.padding(16.dp)) {
        Row {
            OutlinedTextField(value = company, onValueChange = { company = it }, label = { Text("Add company") }, modifier = Modifier.weight(1f))
            Spacer(Modifier.width(8.dp))
            Button(onClick = {
                scope.launch {
                    runCatching { OutsightClient.addWatchlist(company) }.onSuccess {
                        items = it
                        company = ""
                    }
                }
            }) { Text("Add") }
        }
        LazyColumn(Modifier.padding(top = 12.dp)) {
            items(items) { item ->
                ListItem(
                    headlineContent = { Text(item.company) },
                    supportingContent = { Text(item.addedAt) },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                )
                Divider()
            }
        }
    }
}
