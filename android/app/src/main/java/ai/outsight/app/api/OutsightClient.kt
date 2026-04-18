package ai.outsight.app.api

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

object OutsightClient {
    var baseUrl: String = "http://10.0.2.2:4000"

    private val http = HttpClient(Android) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

    @Serializable data class IntelligenceRequest(val company: String, val executive: Boolean = false)
    @Serializable data class WatchlistWrap(val watchlist: List<WatchlistItem>)
    @Serializable data class AlertsWrap(val alerts: List<AlertItem>)
    @Serializable data class ComparisonRow(
        val company: String,
        val automation_readiness_score: Int,
        val ai_adoption_probability: Int,
        val outsourcing_expansion_likelihood: Int,
        val vendor_win_probability: Int,
        val vendor_displacement_risk: Int,
        val deal_probability_12m: Int
    )
    @Serializable data class CompareWrap(val comparison: List<ComparisonRow>)
    @Serializable data class CompareReq(val companies: List<String>)
    @Serializable data class AddWatchReq(val company: String)
    @Serializable data class SubscribeReq(val email: String? = null, val pushToken: String? = null)

    suspend fun intelligence(company: String, executive: Boolean = false): IntelligencePayload =
        http.post("$baseUrl/intelligence") {
            contentType(ContentType.Application.Json)
            setBody(IntelligenceRequest(company, executive))
        }.body<IntelligenceResponse>().data

    suspend fun watchlist(): List<WatchlistItem> =
        http.get("$baseUrl/watchlist").body<WatchlistWrap>().watchlist

    suspend fun addWatchlist(company: String): List<WatchlistItem> =
        http.post("$baseUrl/watchlist") {
            contentType(ContentType.Application.Json)
            setBody(AddWatchReq(company))
        }.body<WatchlistWrap>().watchlist

    suspend fun alerts(): List<AlertItem> =
        http.get("$baseUrl/alerts").body<AlertsWrap>().alerts

    suspend fun subscribe(email: String?, pushToken: String?) {
        http.post("$baseUrl/alerts/subscribe") {
            contentType(ContentType.Application.Json)
            setBody(SubscribeReq(email, pushToken))
        }
    }

    suspend fun compare(companies: List<String>): List<ComparisonRow> =
        http.post("$baseUrl/compare") {
            contentType(ContentType.Application.Json)
            setBody(CompareReq(companies))
        }.body<CompareWrap>().comparison
}
