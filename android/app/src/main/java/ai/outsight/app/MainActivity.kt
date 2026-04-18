package ai.outsight.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ai.outsight.app.ui.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { OutsightApp() }
    }
}

@Composable
fun OutsightApp() {
    val nav = rememberNavController()
    MaterialTheme(colorScheme = darkColorScheme()) {
        Scaffold(
            bottomBar = {
                NavigationBar {
                    NavigationBarItem(selected = true, onClick = { nav.navigate("search") },
                        icon = {}, label = { Text("Search") })
                    NavigationBarItem(selected = false, onClick = { nav.navigate("watchlist") },
                        icon = {}, label = { Text("Watchlist") })
                    NavigationBarItem(selected = false, onClick = { nav.navigate("alerts") },
                        icon = {}, label = { Text("Alerts") })
                    NavigationBarItem(selected = false, onClick = { nav.navigate("compare") },
                        icon = {}, label = { Text("Compare") })
                }
            }
        ) { padding ->
            NavHost(navController = nav, startDestination = "search", modifier = Modifier.padding(padding)) {
                composable("search") { SearchScreen(onOpen = { nav.navigate("company/$it") }) }
                composable("watchlist") { WatchlistScreen(onOpen = { nav.navigate("company/$it") }) }
                composable("alerts") { AlertsScreen() }
                composable("compare") { CompareScreen() }
                composable("company/{name}") {
                    val name = it.arguments?.getString("name") ?: return@composable
                    CompanyScreen(name)
                }
            }
        }
    }
}
