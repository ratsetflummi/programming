package com.example.helloandroid
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import com.example.helloandroid.ui.theme.HelloAndroidTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import java.util.UUID
import androidx.compose.foundation.lazy.LazyColumn

import android.app.DatePickerDialog
import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import androidx.compose.ui.text.input.KeyboardType
import androidx.navigation.NavHostController

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.preferences.core.edit
import androidx.compose.foundation.layout.Arrangement
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import com.google.gson.*
import java.lang.reflect.Type


class LocalDateAdapter : JsonSerializer<LocalDate>, JsonDeserializer<LocalDate> {
    private val formatter = DateTimeFormatter.ISO_DATE

    override fun serialize(src: LocalDate?, typeOfSrc: Type?, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src?.format(formatter) ?: "")
    }

    override fun deserialize(json: JsonElement?, typeOfT: Type?, context: JsonDeserializationContext): LocalDate {
        return try {
            LocalDate.parse(json?.asString ?: "")
        } catch (e: Exception) {
            LocalDate.now() // fallback if JSON is empty or invalid
        }
    }
}

// DataStore singleton
val Context.dataStore by preferencesDataStore(name = "entries_store")
object EntryStorage {
    private val ENTRIES_KEY = stringPreferencesKey("entries_json")
    private val RECURRING_KEY = stringPreferencesKey("recurring_json")

    private val gson = GsonBuilder()
        .registerTypeAdapter(LocalDate::class.java, LocalDateAdapter())
        .create()

    fun saveEntries(context: android.content.Context, entries: List<Entry>) {
        val json = gson.toJson(entries)
        CoroutineScope(Dispatchers.IO).launch {
            context.dataStore.edit { prefs ->
                prefs[ENTRIES_KEY] = json
            }
        }
    }

    fun saveRecurring(context: android.content.Context, entries: List<RecurringEntry>) {
        val json = gson.toJson(entries)
        CoroutineScope(Dispatchers.IO).launch {
            context.dataStore.edit { prefs ->
                prefs[RECURRING_KEY] = json
            }
        }
    }

    fun loadEntries(context: android.content.Context): Flow<List<Entry>> {
        return context.dataStore.data.map { prefs ->
            val json = prefs[ENTRIES_KEY] ?: "[]"
            val type = object : TypeToken<List<Entry>>() {}.type
            gson.fromJson(json, type)
        }
    }

    fun loadRecurring(context: android.content.Context): Flow<List<RecurringEntry>> {
        return context.dataStore.data.map { prefs ->
            val json = prefs[RECURRING_KEY] ?: "[]"
            val type = object : TypeToken<List<RecurringEntry>>() {}.type
            gson.fromJson(json, type)
        }
    }
}

// Data classes
data class Entry(
    val id: String = UUID.randomUUID().toString(),
    val number: Double,
    val text: String,
    val type: String,
    val currency: String,
    val date: LocalDate = LocalDate.now()
)

data class RecurringEntry(
    val id: String = UUID.randomUUID().toString(),
    val number: Double,
    val text: String,
    val type: String,
    val currency: String,
    val intervalDays: Int = 0,
    val intervalMonths: Int = 0,
    val intervalYears: Int = 0,
    val startDate: LocalDate = LocalDate.now(),
    val endDate: LocalDate = LocalDate.now().plusMonths(1)
)

// Main Activity
@OptIn(ExperimentalMaterial3Api::class)
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HelloAndroidTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AppNavigation()
                }
            }
        }
    }
}

// Navigation
@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val context = LocalContext.current

    var entries by remember { mutableStateOf(listOf<Entry>()) }
    var recurringEntries by remember { mutableStateOf(listOf<RecurringEntry>()) }


    // Load persisted data
    LaunchedEffect(Unit) {
        EntryStorage.loadEntries(context).collect { entries = it }
    }
    LaunchedEffect(Unit) {
        EntryStorage.loadRecurring(context).collect { recurringEntries = it }
    }

    NavHost(navController, startDestination = "main") {
        composable("main") {
            MainScreen(
                entries = entries,
                onEntriesChange = {
                    entries = it
                    EntryStorage.saveEntries(context, it)
                },
                recurringEntries = recurringEntries,
                navController = navController
            )
        }
        composable("recurring") {
            RecurringScreen(
                recurringEntries = recurringEntries,
                onRecurringChange = {
                    recurringEntries = it
                    EntryStorage.saveRecurring(context, it)
                },
                navController = navController
            )
        }
    }
}

// Main Screen
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    entries: List<Entry>,
    onEntriesChange: (List<Entry>) -> Unit,
    recurringEntries: List<RecurringEntry>,
    navController: NavHostController
) {
    val ps = "£"
    val context = LocalContext.current
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    val exchangeRate = 1.2

    var numberInput by remember { mutableStateOf("") }
    var textInput by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf("Expense") }
    var selectedCurrency by remember { mutableStateOf("Euro") }
    var expandedType by remember { mutableStateOf(false) }
    var expandedCurrency by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }

    var currentlyEditingId by remember { mutableStateOf<String?>(null) }
    var expandedEntryMenu by remember { mutableStateOf<String?>(null) }
    var showDeleteAlert by remember { mutableStateOf(false) }
    var entryToDelete: Entry? by remember { mutableStateOf(null) }

    if (showDeleteAlert && entryToDelete != null) {
        AlertDialog(
            onDismissRequest = { showDeleteAlert = false },
            title = { Text("Confirm Deletion") },
            text = { Text("Are you sure you want to delete this entry?") },
            confirmButton = {
                TextButton(onClick = {
                    entryToDelete?.let {
                        onEntriesChange(entries.filter { entry -> entry.id != it.id })
                    }
                    showDeleteAlert = false
                    entryToDelete = null
                }) {
                    Text("Yes")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteAlert = false }) {
                    Text("No")
                }
            }
        )
    }

    // Get all recurring entries that have already occurred (i.e., past entries)
    val recurringProjectionPast = remember(recurringEntries) {
        recurringEntries.flatMap { r ->
            val dates = mutableListOf<LocalDate>()
            var current = r.startDate
            // Add recurring dates that have already happened or are happening today
            while (current <= r.endDate && current <= LocalDate.now()) {
                dates.add(current)
                current = current.plusDays(r.intervalDays.toLong())
                    .plusMonths(r.intervalMonths.toLong())
                    .plusYears(r.intervalYears.toLong())
            }
            dates.map { d ->
                Entry(
                    number = r.number,
                    text = r.text,
                    type = r.type,
                    currency = r.currency,
                    date = d
                )
            }
        }
    }

    // Project recurring entries for the next 30 days only (upcoming occurrences)
    val projectedRecurring = remember(recurringEntries) {
        recurringEntries.flatMap { r ->
            val dates = mutableListOf<LocalDate>()
            var current = r.startDate

            // Add recurring dates that fall within the next 30 days
            while (current <= r.endDate && current <= LocalDate.now().plusDays(30)) {
                // Only add the date if it is within the next 30 days and has not already been added
                if (current >= LocalDate.now() && current <= LocalDate.now().plusDays(30)) {
                    dates.add(current)
                }

                // Move to the next occurrence based on the interval
                current = current.plusDays(r.intervalDays.toLong())
                    .plusMonths(r.intervalMonths.toLong())
                    .plusYears(r.intervalYears.toLong())
            }

            // Convert the dates to Entry objects
            dates.map { d ->
                Entry(
                    number = r.number,
                    text = r.text,
                    type = r.type,
                    currency = r.currency,
                    date = d
                )
            }
        }
    }

    // Combine regular entries with all past recurring entries
    val allEntries = (entries + recurringProjectionPast).sortedByDescending { it.date }

    // Calculate the current total sum (regular entries + all past recurring entries)
    val sum = allEntries.sumOf { entry ->
        val amountInEuro = if (entry.currency == "Pound") entry.number * exchangeRate else entry.number
        if (entry.type == "Expense") -amountInEuro else amountInEuro
    }

    // Calculate the sum of projected recurring entries for the next 30 days (upcoming only)
    val projectedRecurringSum = projectedRecurring.sumOf { entry ->
        val amountInEuro = if (entry.currency == "Pound") entry.number * exchangeRate else entry.number
        if (entry.type == "Expense") -amountInEuro else amountInEuro
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Tracker", style = MaterialTheme.typography.headlineSmall)
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = numberInput,
                onValueChange = { numberInput = it },
                label = { Text("Number") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = textInput,
                onValueChange = { textInput = it },
                label = { Text("Text") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ExposedDropdownMenuBox(
                    expanded = expandedType,
                    onExpandedChange = { expandedType = !expandedType },
                    modifier = Modifier.weight(1f)
                ) {
                    OutlinedTextField(
                        value = selectedType,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Type") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expandedType) },
                        modifier = Modifier.menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedType,
                        onDismissRequest = { expandedType = false }
                    ) {
                        DropdownMenuItem(text = { Text("Expense") }, onClick = { selectedType = "Expense"; expandedType = false })
                        DropdownMenuItem(text = { Text("Income") }, onClick = { selectedType = "Income"; expandedType = false })
                    }
                }

                ExposedDropdownMenuBox(
                    expanded = expandedCurrency,
                    onExpandedChange = { expandedCurrency = !expandedCurrency },
                    modifier = Modifier.weight(1f)
                ) {
                    OutlinedTextField(
                        value = selectedCurrency,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Currency") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expandedCurrency) },
                        modifier = Modifier.menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedCurrency,
                        onDismissRequest = { expandedCurrency = false }
                    ) {
                        DropdownMenuItem(text = { Text("Euro") }, onClick = { selectedCurrency = "Euro"; expandedCurrency = false })
                        DropdownMenuItem(text = { Text("Pound") }, onClick = { selectedCurrency = "Pound"; expandedCurrency = false })
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = selectedDate.format(formatter),
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Date") },
                    modifier = Modifier.fillMaxWidth()
                )
                Box(modifier = Modifier.matchParentSize().clickable {
                    val dp = DatePickerDialog(
                        context,
                        { _, y, m, d -> selectedDate = LocalDate.of(y, m + 1, d) },
                        selectedDate.year, selectedDate.monthValue - 1, selectedDate.dayOfMonth
                    )
                    dp.show()
                })
            }

            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = {
                val num = numberInput.replace(",", ".").toDoubleOrNull() ?: return@Button
                if (currentlyEditingId != null) {
                    val updated = entries.map {
                        if (it.id == currentlyEditingId) it.copy(
                            number = num,
                            text = textInput,
                            type = selectedType,
                            currency = selectedCurrency,
                            date = selectedDate
                        ) else it
                    }
                    onEntriesChange(updated)
                    currentlyEditingId = null
                } else {
                    onEntriesChange(entries + Entry(
                        number = num,
                        text = textInput,
                        type = selectedType,
                        currency = selectedCurrency,
                        date = selectedDate
                    ))
                }
                numberInput = ""
                textInput = ""
                selectedType = "Expense"
                selectedCurrency = "Euro"
            }, modifier = Modifier.fillMaxWidth()) {
                Text(if (currentlyEditingId != null) "Save" else "Add")
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text("Total: %.2f€ | %.2f$ps".format(sum, sum / exchangeRate))
            Text("Projected Recurring (next 30 days): %.2f€ | %.2f$ps".format(projectedRecurringSum, projectedRecurringSum / exchangeRate))

            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { navController.navigate("recurring") }) { Text("Go to Recurring Entries") }
        }


        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
            val grouped = allEntries.groupBy { it.date }
            grouped.forEach { (date, entriesForDay) ->
                item {
                    Text(
                        date.format(DateTimeFormatter.ISO_DATE),
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }
                items(entriesForDay) { entry ->
                    val sign = if (entry.type == "Expense") "-" else "+"
                    Card(modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clickable {
                            expandedEntryMenu = if (expandedEntryMenu == entry.id) null else entry.id // Toggle visibility
                        }
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(text = entry.text, style = MaterialTheme.typography.bodyLarge)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$sign ${entry.number} ${entry.currency}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                text = entry.date.format(formatter),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.secondary
                            )
                        }

                        // Add Dropdown menu for each entry (Edit & Delete)
                        DropdownMenu(
                            expanded = expandedEntryMenu == entry.id, // Check if the current entry's id matches the expanded state
                            onDismissRequest = { expandedEntryMenu = null } // Close menu when dismissed
                        ) {
                            DropdownMenuItem(
                                text = { Text("Edit") },
                                onClick = {
                                    numberInput = entry.number.toString()
                                    textInput = entry.text
                                    selectedType = entry.type
                                    selectedCurrency = entry.currency
                                    selectedDate = entry.date
                                    currentlyEditingId = entry.id
                                    expandedEntryMenu = null // Close the menu after selecting "Edit"
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Delete") },
                                onClick = {
                                    entryToDelete = entry
                                    showDeleteAlert = true
                                    expandedEntryMenu = null // Close the menu after selecting "Delete"
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}


// Recurring Screen
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecurringScreen(
    recurringEntries: List<RecurringEntry>,
    onRecurringChange: (List<RecurringEntry>) -> Unit,
    navController: NavHostController
) {
    val context = LocalContext.current
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    var numberInput by remember { mutableStateOf("") }
    var textInput by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf("Income") }
    var selectedCurrency by remember { mutableStateOf("Euro") }
    var intervalDays by remember { mutableStateOf("") }
    var intervalMonths by remember { mutableStateOf("") }
    var intervalYears by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf(LocalDate.now()) }
    var endDate by remember { mutableStateOf(LocalDate.now().plusMonths(1)) }
    var expandedEntryMenu by remember { mutableStateOf<String?>(null) }
    var currentlyEditingId by remember { mutableStateOf<String?>(null) }
    var expandedType by remember { mutableStateOf(false) }
    var expandedCurrency by remember { mutableStateOf(false) }
    var showDeleteRecurringAlert by remember { mutableStateOf(false) }
    var recurringEntryToDelete: RecurringEntry? by remember { mutableStateOf(null) }

    if (showDeleteRecurringAlert && recurringEntryToDelete != null) {
        AlertDialog(
            onDismissRequest = { showDeleteRecurringAlert = false },
            title = { Text("Confirm Deletion") },
            text = { Text("Are you sure you want to delete this recurring entry?") },
            confirmButton = {
                TextButton(onClick = {
                    recurringEntryToDelete?.let {
                        onRecurringChange(recurringEntries.filter { entry -> entry.id != it.id })
                    }
                    showDeleteRecurringAlert = false
                    recurringEntryToDelete = null
                }) {
                    Text("Yes")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteRecurringAlert = false }) {
                    Text("No")
                }
            }
        )
    }
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Recurring Entries", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(value = numberInput, onValueChange = { numberInput = it }, label = { Text("Amount") })
        OutlinedTextField(value = textInput, onValueChange = { textInput = it }, label = { Text("Text") })

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(value = intervalDays, onValueChange = { intervalDays = it }, label = { Text("Days") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.weight(1f))
            OutlinedTextField(value = intervalMonths, onValueChange = { intervalMonths = it }, label = { Text("Months") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.weight(1f))
            OutlinedTextField(value = intervalYears, onValueChange = { intervalYears = it }, label = { Text("Years") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(modifier = Modifier.weight(1f)) {
                OutlinedTextField(value = startDate.format(formatter), onValueChange = {}, readOnly = true, label = { Text("Start Date") }, modifier = Modifier.fillMaxWidth())
                Box(modifier = Modifier.matchParentSize().clickable {
                    val dp = DatePickerDialog(context, { _, y, m, d -> startDate = LocalDate.of(y, m+1, d) }, startDate.year, startDate.monthValue-1, startDate.dayOfMonth)
                    dp.show()
                })
            }
            Box(modifier = Modifier.weight(1f)) {
                OutlinedTextField(value = endDate.format(formatter), onValueChange = {}, readOnly = true, label = { Text("End Date") }, modifier = Modifier.fillMaxWidth())
                Box(modifier = Modifier.matchParentSize().clickable {
                    val dp = DatePickerDialog(context, { _, y, m, d -> endDate = LocalDate.of(y, m+1, d) }, endDate.year, endDate.monthValue-1, endDate.dayOfMonth)
                    dp.show()
                })
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ExposedDropdownMenuBox(expanded = expandedType, onExpandedChange = { expandedType = !expandedType }, modifier = Modifier.weight(1f)) {
                OutlinedTextField(value = selectedType, onValueChange = {}, readOnly = true, label = { Text("Type") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expandedType) }, modifier = Modifier.menuAnchor())
                ExposedDropdownMenu(expanded = expandedType, onDismissRequest = { expandedType = false }) {
                    DropdownMenuItem(text = { Text("Income") }, onClick = { selectedType = "Income"; expandedType = false })
                    DropdownMenuItem(text = { Text("Expense") }, onClick = { selectedType = "Expense"; expandedType = false })
                }
            }
            ExposedDropdownMenuBox(expanded = expandedCurrency, onExpandedChange = { expandedCurrency = !expandedCurrency }, modifier = Modifier.weight(1f)) {
                OutlinedTextField(value = selectedCurrency, onValueChange = {}, readOnly = true, label = { Text("Currency") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expandedCurrency) }, modifier = Modifier.menuAnchor())
                ExposedDropdownMenu(expanded = expandedCurrency, onDismissRequest = { expandedCurrency = false }) {
                    DropdownMenuItem(text = { Text("Euro") }, onClick = { selectedCurrency = "Euro"; expandedCurrency = false })
                    DropdownMenuItem(text = { Text("Pound") }, onClick = { selectedCurrency = "Pound"; expandedCurrency = false })
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = {
            val num = numberInput.toDoubleOrNull() ?: return@Button
            val dDays = intervalDays.toIntOrNull() ?: 0
            val dMonths = intervalMonths.toIntOrNull() ?: 0
            val dYears = intervalYears.toIntOrNull() ?: 0
            if (currentlyEditingId != null) {
                val updated = recurringEntries.map {
                    if (it.id == currentlyEditingId) it.copy(
                        number = num,
                        text = textInput,
                        type = selectedType,
                        currency = selectedCurrency,
                        intervalDays = dDays,
                        intervalMonths = dMonths,
                        intervalYears = dYears,
                        startDate = startDate,
                        endDate = endDate
                    ) else it
                }
                onRecurringChange(updated)
                currentlyEditingId = null
            } else {
                onRecurringChange(
                    recurringEntries + RecurringEntry(
                        number = num,
                        text = textInput,
                        type = selectedType,
                        currency = selectedCurrency,
                        intervalDays = dDays,
                        intervalMonths = dMonths,
                        intervalYears = dYears,
                        startDate = startDate,
                        endDate = endDate
                    )
                )
            }
            numberInput = ""
            textInput = ""
            intervalDays = ""
            intervalMonths = ""
            intervalYears = ""
        }) {
            Text(if (currentlyEditingId != null) "Save" else "Add Recurring Entry")
        }

        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = { navController.popBackStack() }) {
            Text("Back")
        }

        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn {
            items(recurringEntries) { entry ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clickable { expandedEntryMenu = entry.id }
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Text("${entry.text} | ${entry.number} ${entry.currency}")
                        Text("Interval: ${entry.intervalDays}d ${entry.intervalMonths}m ${entry.intervalYears}y")
                        Text("From ${entry.startDate.format(formatter)} to ${entry.endDate.format(formatter)}")
                    }
                    DropdownMenu(
                        expanded = expandedEntryMenu == entry.id,
                        onDismissRequest = { expandedEntryMenu = null }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Edit") },
                            onClick = {
                                numberInput = entry.number.toString()
                                textInput = entry.text
                                selectedType = entry.type
                                selectedCurrency = entry.currency
                                intervalDays = entry.intervalDays.toString()
                                intervalMonths = entry.intervalMonths.toString()
                                intervalYears = entry.intervalYears.toString()
                                startDate = entry.startDate
                                endDate = entry.endDate
                                currentlyEditingId = entry.id
                                expandedEntryMenu = null
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Delete") },
                            onClick = {
                                recurringEntryToDelete = entry
                                showDeleteRecurringAlert = true
                                expandedEntryMenu = null // Close the menu after selecting "Delete"
                            }
                        )
                    }
                }
            }
        }
    }
}
