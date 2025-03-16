import { format } from "date-fns";
import { View, Image, Text, StyleSheet } from "react-native";

const TransactionItem = ({ transaction }: { transaction: any }) => {
  const isExpense = transaction.type === "gasto";
  const formattedDate = format(
    new Date(transaction.createdAt),
    "hh:mma dd MMM yyyy"
  );

  return (
    <View style={styles.transactionContainer}>
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/icons/more-up.png")}
          style={styles.icon}
        />
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.transactionTitle}>{transaction.title}</Text>
        <Text style={styles.transactionDetails}>
          {formattedDate.split(" ")[0]}{" "}
          {formattedDate.split(" ").slice(1).join(" ")}
        </Text>
        <Text style={styles.transactionPayment}>
          {transaction.description}
        </Text>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          isExpense ? styles.expense : styles.income,
        ]}
      >
        {isExpense ? "- S/" : "+ S/"}
        {transaction.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  transactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#888",
  },
  detailsContainer: {
    flex: 1,
    flexDirection: "column",
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "bold"
  },
  transactionDetails: {
    fontSize: 12,
    color: "#666",
  },
  transactionPayment: {
    fontSize: 12,
    color: "#999",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expense: {
    color: "#E86F51",
  },
  income: {
    color: "#65CE13",
  },
});

export default TransactionItem;
