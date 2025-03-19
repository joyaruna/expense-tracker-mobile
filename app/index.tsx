import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Asterisk } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Expense {
    id: number;
    title: string;
    amount: number;
}

interface ExpenseTracker {
    id: number;
    name: string;
    date: Date;
    expenses: Expense[];
    status: "In progress ⚠️" | "Cleared ✅";
    expanded: boolean;
}

const App: React.FC = () => {
    const [trackers, setTrackers] = useState<ExpenseTracker[]>([]);
    const [trackerName, setTrackerName] = useState<string>("");
    const [trackerDate, setTrackerDate] = useState<Date | null>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [expenseTitle, setExpenseTitle] = useState<string>("");
    const [expenseAmount, setExpenseAmount] = useState<string>("");

    useEffect(() => {
        const loadTrackers = async () => {
          const storedTrackers = await AsyncStorage.getItem("trackers");
          if (storedTrackers) {
            const parsedTrackers = JSON.parse(storedTrackers).map((tracker: any) => ({
              ...tracker,
              date: new Date(tracker.date), // Convert string back to Date object
            }));
            setTrackers(parsedTrackers.sort((a: ExpenseTracker, b: ExpenseTracker)  => Math.abs(new Date().getTime() - a.date.getTime()) - Math.abs(new Date().getTime() - b.date.getTime())));
        }
        };
        loadTrackers();
      }, []);
      

    useEffect(() => {
        AsyncStorage.setItem("trackers", JSON.stringify(trackers));
    }, [trackers]);

    const addTracker = (): void => {
        if (!trackerName) return;
        const newTracker: ExpenseTracker = {
          id: Date.now(),
          name: trackerName,
          date: trackerDate || new Date(), // Ensure date is always valid
          expenses: [],
          status: "In progress ⚠️",
          expanded: false,
        };
        setTrackers([...trackers, newTracker].sort((a, b) => a.date.getTime() - b.date.getTime()));
        setTrackerName("");
        setTrackerDate(new Date());
      };
      


    const deleteTracker = (trackerId: number): void => {
        setTrackers(trackers.filter(tracker => tracker.id !== trackerId));
    };


    const addExpense = (trackerId: number, title: string, amount: string): void => {
        if (!title || !amount) return;
        setTrackers(trackers.map(tracker =>
            tracker.id === trackerId
                ? { ...tracker, expenses: [...tracker.expenses, { id: Date.now(), title, amount: parseFloat(amount) }] }
                : tracker
        ));
        setExpenseTitle("");
        setExpenseAmount("");
    };


    const deleteExpense = (trackerId: number, expenseId: number): void => {
        setTrackers(trackers.map(tracker =>
            tracker.id === trackerId
                ? { ...tracker, expenses: tracker.expenses.filter(expense => expense.id !== expenseId) }
                : tracker
        ));
    };
    const toggleStatus = (trackerId: number): void => {
        setTrackers(trackers.map(tracker =>
            tracker.id === trackerId
                ? { ...tracker, status: tracker.status === "In progress ⚠️" ? "Cleared ✅" : "In progress ⚠️" }
                : tracker
        ));
    };

    const toggleExpand = (trackerId: number): void => {
        setTrackers(trackers.map(tracker =>
            tracker.id === trackerId
                ? { ...tracker, expanded: !tracker.expanded }
                : tracker
        ));
    };

    const getTotal = (tracker: ExpenseTracker): number => {
        return tracker.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Expense Tracker</Text>
            <View style={styles.inputGroup}>
                <TextInput
                    placeholder="Input Tracker Name"
                    value={trackerName}
                    onChangeText={setTrackerName}
                    style={styles.inputBox}
                    placeholderTextColor="#fff"
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                    <Text style={{ color: "#800080" }}>{trackerDate ? trackerDate.toDateString() : "Select Date"}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={trackerDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setTrackerDate(selectedDate);
                        }}
                    />
                )}
                <TouchableOpacity onPress={addTracker} style={styles.addButton}>
                    <Text style={styles.buttonText}>Add Tracker</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.trackerList}>
                <FlatList
                    data={trackers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.trackerCard}>
                            <Text style={styles.trackerName}>{item.name}</Text>
                            <Text style={styles.trackerDate}>Created on: {new Date(item.date).toDateString()}</Text>
                            <Text style={styles.trackerName}>Total: ${getTotal(item).toFixed(2)}</Text>
                            <Text style={styles.trackerDate}>Status: {item.status ? item.status : "In progress ⚠️"}</Text>
                            <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.expandButton}>
                                <Text style={styles.hideText}>{item.expanded ? "Hide Details..🤌" : "Show Details..👆"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteTracker(item.id)} style={{ alignItems: 'center' }}>
                                <Trash2 size={20} color="#E30B5C" />
                            </TouchableOpacity>
                            {item.expanded && (
                                <View style={styles.itemGroup}>
                                    {item.status === "In progress ⚠️" &&
                                        <View>
                                            <TextInput
                                                placeholder="Expense Title"
                                                style={styles.titleInput}
                                                value={expenseTitle}
                                                onChangeText={setExpenseTitle}
                                                placeholderTextColor="#fff"
                                            />
                                            <TextInput
                                                placeholder="Amount (USD)"
                                                keyboardType="numeric"
                                                style={styles.amountInput}
                                                value={expenseAmount}
                                                onChangeText={setExpenseAmount}
                                            />
                                            <TouchableOpacity onPress={() => addExpense(item.id, expenseTitle, expenseAmount)} style={styles.chooseButton}>
                                                <PlusCircle size={24} color="#097969" />
                                            </TouchableOpacity>
                                            {item.expenses.map((expense) => (
                                                <View key={expense.id} style={styles.itemContainer}>
                                                    <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                                        <Asterisk size={15} color="#800080" />
                                                        <Text style={styles.itemName}>{expense.title}: ${expense.amount.toFixed(2)}</Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => deleteExpense(item.id, expense.id)}>
                                                        <Trash2 size={15} color="#E30B5C" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    }
                                    <TouchableOpacity onPress={() => toggleStatus(item.id)} style={styles.completedButton}>
                                        <Text style={styles.doneText}>
                                        {item.status === "In progress ⚠️" ? "Done" : "Edit"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                />
            </View>
        </ScrollView>
    );
};


const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: '#FF69B4',
        display: 'flex',
        flex: 1
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        fontFamily: 'Pacifico_400Regular',
        color: '#F8C8DC',
        textAlign: 'center'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    inputBox: {
        textAlign: 'center',
        width: '100%',
        borderColor: '#800080',
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: '#F8C8DC',
        color: '#800080',
        padding: 10,
        marginBottom: 10,
        outline: 'none'
    },
    dateButton: {
        marginBottom: 10,
        borderColor: '#800080',
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: '#F8C8DC',
        paddingVertical: 10,
        paddingHorizontal: 30,

    },
    addButton: {
        backgroundColor: "#800080",
        paddingVertical: 10,
        width: '60%',
        borderRadius: 50,
    },
    buttonText: {
        color: "#F8C8DC",
        textAlign: "center"
    },
    trackerList: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },

    trackerCard: {
        marginTop: 20,
        padding: 15,
        borderWidth: 1,
        backgroundColor: '#F8C8DC',
        borderColor: '#800080',
        borderRadius: 20

    },
    trackerName: {
        textAlign: 'center',
        fontFamily: 'Pacifico_400Regular',
        color: '#800080',
        fontSize: 20,
        fontWeight: "700",
    },
    trackerDate: {
        textAlign: 'center',
        fontFamily: 'DancingScript_400Regular',
        color: '#800080',
        fontSize: 16,
        fontWeight: "400",
        marginVertical: 10
    },
    expandButton: {
        alignItems: 'center'
    },
    hideText: {
        textAlign: 'center',
        fontFamily: 'DancingScript_400Regular',
        color: '#DC143C',
        fontSize: 16,
        fontWeight: "400",
    },
    itemGroup: {
        display: 'flex',
        flexDirection: 'column',
        marginVertical: 10,
    },
    titleInput: {
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#800080',
        paddingVertical: 10,
        borderRadius: 30,
        color: '#800080',
    },
    amountInput: {
        textAlign: 'center',
        borderWidth: 1,
        backgroundColor: '#800080',
        marginVertical: 10,
        paddingVertical: 10,
        borderRadius: 30,
        color: '#F8C8DC',
    },
    chooseButton: {
        alignItems: 'center',
        marginBottom: 20
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    itemName: {
        textAlign: 'center',
        fontFamily: 'DancingScript_400Regular',
        color: '#800080',
        fontSize: 16,
        fontWeight: "400",
        marginLeft: 10
    },
    completedButton: {
        backgroundColor: "#800080",
        paddingVertical: 10,
        borderRadius: 10,
        paddingHorizontal: 10,
        width: '40%',
        alignItems:"center"
    },
    doneText: {
        textAlign: 'center',
        fontFamily: 'DancingScript_400Regular',
        color: '#F8C8DC',
        fontSize: 16,
        fontWeight: "400", 
    }
});

export default App;
