// import React, { useRef, useState } from "react";
// import { View, Text, TextInput, Button, StyleSheet } from "react-native";
// import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
// import { PhoneAuthProvider, signInWithCredential, ApplicationVerifier } from "firebase/auth";
// import  { auth, firebaseConfig } from "../../api/firebaseConfig";

// export default function PhoneAuthScreen({ navigation }: any) {
//   // ✅ Ref tipi: ApplicationVerifier (Firebase tipi)
//   const recaptchaVerifier = useRef<ApplicationVerifier | null>(null);

//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [verificationId, setVerificationId] = useState<string | null>(null);
//   const [verificationCode, setVerificationCode] = useState("");
//   const [message, setMessage] = useState("");

//   const sendVerification = async () => {
//     try {
//       if (!recaptchaVerifier.current) throw new Error("reCAPTCHA başlatılamadı!");
//       const phoneProvider = new PhoneAuthProvider(auth);
//       const id = await phoneProvider.verifyPhoneNumber(
//         phoneNumber,
//         recaptchaVerifier.current
//       );
//       setVerificationId(id);
//       setMessage("Kod gönderildi!");
//     } catch (err: any) {
//       setMessage(`Hata: ${err.message}`);
//     }
//   };

//   const confirmCode = async () => {
//     try {
//       if (!verificationId) throw new Error("Doğrulama ID'si bulunamadı!");
//       const credential = PhoneAuthProvider.credential(
//         verificationId,
//         verificationCode
//       );
//       await signInWithCredential(auth, credential);
//       setMessage("Giriş başarılı 🎉");
//       navigation.replace("Home");
//     } catch (err: any) {
//       setMessage(`Hata: ${err.message}`);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* 🔥 reCAPTCHA modal */}
//       <FirebaseRecaptchaVerifierModal
//         ref={recaptchaVerifier as any} // burada cast gerekli
//         firebaseConfig={firebaseConfig}
//       />

//       {!verificationId ? (
//         <>
//           <Text style={styles.label}>Telefon Numarası (+90...):</Text>
//           <TextInput
//             value={phoneNumber}
//             onChangeText={setPhoneNumber}
//             keyboardType="phone-pad"
//             style={styles.input}
//             placeholder="+905XXXXXXXXX"
//           />
//           <Button title="Doğrulama Kodu Gönder" onPress={sendVerification} />
//         </>
//       ) : (
//         <>
//           <Text style={styles.label}>SMS Kodu:</Text>
//           <TextInput
//             value={verificationCode}
//             onChangeText={setVerificationCode}
//             keyboardType="number-pad"
//             style={styles.input}
//             placeholder="123456"
//           />
//           <Button title="Kodu Onayla" onPress={confirmCode} />
//         </>
//       )}

//       {message ? <Text style={styles.message}>{message}</Text> : null}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   label: { fontSize: 16, marginBottom: 8 },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 10,
//   },
//   message: { marginTop: 20, color: "green", textAlign: "center" },
// });
