import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollContent: {
    backgroundColor: "#FFF",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  title: {
    fontSize: 32,
    fontFamily: "Outfit_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 50,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  scanButtonContainer: {
    marginVertical: 16,
    alignItems: "center",
    position: "relative",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00DC5A",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#00DC5A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scanButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    marginLeft: 8,
  },
  ocrStatusContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 10,
  },
  carouselContainer: {
    marginTop: 8,
    overflow: "visible",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 20,
  },
  addButtonContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    color: "#FFF",
  },
});

export default styles; 