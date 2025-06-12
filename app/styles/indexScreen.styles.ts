import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    backgroundColor: "#000",
    paddingBottom: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20
  },
  logoContainer: {
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  iconButton: {
    width: 50,
    height: 50,
    backgroundColor: "#00DC5A",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  welcome: {
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Outfit_400Regular",
  },
  username: {
    color: "#00DC5A",
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
  },
});

export default styles; 