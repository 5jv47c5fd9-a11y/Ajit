package ai.outsight.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.outsight.app.api.ExecutiveMode
import ai.outsight.app.api.IntelligencePayload
import ai.outsight.app.api.OutsightClient
import kotlinx.coroutines.launch

@Composable
fun IntelligenceDetail(company: String, data: IntelligencePayload, onAdded: () -> Unit = {}) {
    val scope = rememberCoroutineScope()

    Column(Modifier.padding(vertical = 12.dp)) {
        data.executive_mode?.let { ExecutiveCard(it) }
        Card("Summary") { Text(data.company_summary) }
        Row {
            ScoreTile("Automation", data.automation_readiness_score, Modifier.weight(1f))
            Spacer(Modifier.width(8.dp))
            ScoreTile("AI Adoption", data.ai_adoption_probability, Modifier.weight(1f))
        }
        Row(Modifier.padding(top = 8.dp)) {
            ScoreTile("Vendor Win", data.vendor_win_probability, Modifier.weight(1f))
            Spacer(Modifier.width(8.dp))
            ScoreTile("Displacement", data.vendor_displacement_risk, Modifier.weight(1f))
        }

        Card("Deal Probability") {
            Row {
                Deal("3m", data.deal_probability_prediction.probability_3_months)
                Deal("6m", data.deal_probability_prediction.probability_6_months)
                Deal("12m", data.deal_probability_prediction.probability_12_months)
            }
        }

        Card("Strategic Horizon") { Text(data.strategic_horizon) }
        Card("Executive Summary") { Text(data.executive_summary) }

        SignalCard("Vendor Opportunities", data.vendor_opportunities)
        SignalCard("Vendor Threats", data.vendor_threats)
        SignalCard("Outsourcing Signals", data.outsourcing_signals)
        SignalCard("Automation Risk", data.automation_risk_signals)
        SignalCard("Hiring", data.hiring_signals)
        SignalCard("Tech Stack", data.technology_stack_indicators)
        SignalCard("Digital Transformation", data.digital_transformation_indicators)

        Card("Predictive Outsourcing Forecast") {
            data.predictive_outsourcing_forecast.forEach { f ->
                Text("${f.function}: 6m ${f.probability_6m}% • 12m ${f.probability_12m}% • 24m ${f.probability_24m}%")
            }
        }

        Card("Recommended Strategy") {
            Text("If already a vendor:", style = MaterialTheme.typography.labelLarge)
            Text(data.recommended_vendor_strategy.if_already_vendor)
            Spacer(Modifier.height(8.dp))
            Text("If not yet a vendor:", style = MaterialTheme.typography.labelLarge)
            Text(data.recommended_vendor_strategy.if_not_currently_vendor)
        }

        Button(onClick = {
            scope.launch {
                runCatching { OutsightClient.addWatchlist(company) }
                onAdded()
            }
        }, modifier = Modifier.padding(top = 12.dp)) { Text("Add to Watchlist") }
    }
}

@Composable
fun ExecutiveCard(mode: ExecutiveMode) {
    Card("Executive Mode") {
        Text("Vendor Win ${mode.vendor_win_probability_score}%")
        Text("Automation Disruption ${mode.automation_disruption_probability}%")
        Text("Outsourcing Expansion ${mode.outsourcing_expansion_likelihood}%")
        Text("Deal Timing: ${mode.predicted_deal_timing_window}")
        Spacer(Modifier.height(8.dp))
        Text("Top 5 Strategic Actions", style = MaterialTheme.typography.labelLarge)
        mode.top_5_strategic_actions.forEachIndexed { i, a -> Text("${i + 1}. $a") }
    }
}

@Composable
fun Card(title: String, content: @Composable ColumnScope.() -> Unit) {
    androidx.compose.material3.Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(title, style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(6.dp))
            content()
        }
    }
}

@Composable
fun ScoreTile(label: String, value: Int, modifier: Modifier = Modifier) {
    androidx.compose.material3.Card(modifier = modifier) {
        Column(Modifier.padding(12.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium)
            Text("$value", style = MaterialTheme.typography.headlineSmall)
            LinearProgressIndicator(progress = { value / 100f })
        }
    }
}

@Composable
fun Deal(label: String, value: Int) {
    Column(Modifier.padding(8.dp)) {
        Text(label, style = MaterialTheme.typography.labelSmall)
        Text("$value%", style = MaterialTheme.typography.titleMedium)
    }
}

@Composable
fun SignalCard(title: String, items: List<String>) {
    Card(title) {
        items.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
    }
}
