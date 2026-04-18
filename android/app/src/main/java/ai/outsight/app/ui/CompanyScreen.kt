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

@Composable
fun CompanyScreen(name: String) {
    var payload by remember { mutableStateOf<IntelligencePayload?>(null) }
    LaunchedEffect(name) {
        runCatching { OutsightClient.intelligence(name) }.onSuccess { payload = it }
    }
    Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState())) {
        Text(name, style = MaterialTheme.typography.headlineMedium)
        payload?.let { IntelligenceDetail(name, it) } ?: CircularProgressIndicator()
    }
}
