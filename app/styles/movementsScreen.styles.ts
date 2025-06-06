import { StyleSheet, Dimensions, Platform } from 'react-native';
const { width } = Dimensions.get('window');

const DAY_WIDTH = width * 0.15;
const DAY_MARGIN = 8;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F5F5F5" 
  },
  
  headerSafeArea: {
    backgroundColor: "#000000"
  },
  
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#000000",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: Platform.OS === 'ios' ? 160 : 180,
  },
  
  listContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5"
  },
  
  flatList: {
    flex: 1,
    backgroundColor: "#F5F5F5"
  },
  
  flatListContent: {
    backgroundColor: "#F5F5F5",
    paddingBottom: 20
  },
  
  // 🎨 ESTILOS PARA ERROR MEJORADOS
  errorContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  
  errorText: {
    fontSize: 18,
    color: "#E74C3C",
    textAlign: "center",
    fontFamily: "Outfit_600SemiBold",
    marginBottom: 8,
  },
  
  errorSubtext: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
    marginBottom: 20,
    lineHeight: 20,
  },
  
  retryButton: {
    backgroundColor: "#00DC5A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
  },

  title: { 
    fontSize: 26, 
    color: "#F5F5F5", 
    fontWeight: "bold", 
    textAlign: "center", 
    fontFamily: "Outfit_500Medium", 
    marginBottom: 10 
  },
  
  monthContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginVertical: 10, 
    width: "90%", 
    alignSelf: "center" 
  },
  
  monthButton: { 
    flex: 1, 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#FFF", 
    alignItems: "center" 
  },
  
  arrow: { 
    padding: 10, 
    width: 44, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  
  monthText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#00DC5A" 
  },
  
  arrowText: { 
    color: "#FFF", 
    fontSize: 24 
  },
  
  disabled: { 
    color: "#555" 
  },
  
  daysWrapper: { 
    height: 90, 
    marginTop: 8 
  },
  
  daysContainer: { 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    minWidth: width 
  },
  
  dayContainer: { 
    alignItems: "center" 
  },
  
  dayButton: { 
    alignItems: "center", 
    padding: 8, 
    borderRadius: 10, 
    width: DAY_WIDTH, 
    height: 70 
  },
  
  dayActive: { 
    backgroundColor: "#00DC5A", 
    borderColor: "#00DC5A", 
    borderWidth: 1 
  },
  
  dayWithTx: { 
    borderColor: "#00DC5A", 
    borderWidth: 1 
  },
  
  dayEmpty: { 
    borderColor: "#FFF", 
    borderWidth: 1 
  },
  
  dayFuture: { 
    borderColor: "#555", 
    borderWidth: 1 
  },
  
  dayNumber: { 
    color: "#FFF", 
    fontSize: 18, 
    fontFamily: "Outfit_500Medium" 
  },
  
  dayLabel: { 
    color: "#FFF", 
    fontSize: 14, 
    fontFamily: "Outfit_500Medium" 
  },
  
  futureText: { 
    color: "#555" 
  },
  
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: "#00DC5A", 
    marginTop: 9 
  },
  
  dotActive: { 
    backgroundColor: "#FFF" 
  },
  
  todayText: { 
    color: "#FFF", 
    fontSize: 7.5, 
    marginTop: 2, 
    fontWeight: "bold", 
    lineHeight: 10 
  },
  
  group: { 
    marginBottom: 20, 
    paddingHorizontal: 15,
    backgroundColor: "#F5F5F5"
  },
  
  groupDate: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#000", 
    marginBottom: 8,
    fontFamily: "Outfit_600SemiBold"
  },
  
  empty: { 
    fontSize: 14, 
    color: "#666", 
    fontStyle: "italic", 
    textAlign: "center", 
    paddingVertical: 10 
  },
  
  modal: { 
    flex: 1, 
    justifyContent: "center", 
    backgroundColor: "rgba(0,0,0,0.6)", 
    alignItems: "center" 
  },
  
  calendarBox: { 
    width: "90%", 
    backgroundColor: "#fff", 
    padding: 16, 
    borderRadius: 16, 
    elevation: 5 
  },
  
  closeBtn: { 
    marginTop: 12, 
    alignSelf: "center", 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    backgroundColor: "#00DC5A", 
    borderRadius: 8 
  },
  
  closeBtnText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  
  // 🎨 ESTILOS PARA SKELETON LOADING
  daysSkeletonContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  
  daySkeletonItem: {
    alignItems: 'center',
  },
  
  daySkeletonBox: {
    width: DAY_WIDTH,
    height: 70,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    opacity: 0.7,
  },
  
  balanceHeaderSkeleton: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  balanceSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  balanceSkeletonBox: {
    width: 80,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    opacity: 0.7,
  },
});

export default styles; 