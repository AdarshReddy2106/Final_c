import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import styled from "styled-components/native";
import { saveTreeData } from "./services/treeService";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from '@react-navigation/native';
import { useTreeData } from './TreeDataContext';
import { auth } from './firebaseConfig';
import { supabase } from './supabaseConfig';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Container = styled.View`
  flex: 1;
  background-color: #d8e8d2;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Card = styled.View`
  width: 90%;
  background-color: #f5f5dc;
  padding: 20px;
  border-radius: 15px;
  elevation: 5;
  align-items: center;
`;

const UploadButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: white;
  padding: 10px;
  border-radius: 10px;
  margin-top: 10px;
`;

const UploadText = styled.Text`
  font-size: 16px;
  margin-left: 10px;
  color: #4a7c59;
`;

const Button = styled.TouchableOpacity`
  background-color: #4a7c59;
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  margin-top: 20px;
  width: 80%;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

export default function UploadScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const { treeData } = useTreeData();
  const { currentUser } = useAuth();

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!image) {
        Alert.alert("Error", "Please upload an image before saving.");
        return;
      }

      // Get stored student details
      const storedDetails = await AsyncStorage.getItem(`studentDetails_${currentUser.email}`);
      if (!storedDetails) {
        Alert.alert("Error", "Student details not found. Please complete student details first.");
        navigation.navigate('StudentDetails');
        return;
      }

      const studentDetails = JSON.parse(storedDetails);

      // Use treeData from context instead of route.params
      if (!treeData || !treeData.stemData || !Array.isArray(treeData.stemData)) {
        Alert.alert("Error", "Invalid or missing stem data. Please go back and enter the measurements again.");
        return;
      }

      const dataToSave = {
        treeId: treeData.treeId,
        numBranches: treeData.numBranches,
        stemData: treeData.stemData,
        studentName: studentDetails.studentName,
        studentRollNo: studentDetails.studentRollNo,
        studentGroup: studentDetails.studentGroup,
        userEmail: currentUser.email
      };

      console.log('Data being saved:', dataToSave); // Add this for debugging

      await saveTreeData(dataToSave, image);
      
      Alert.alert(
        "Success", 
        "Tree data has been saved!",
        [{ 
          text: "OK", 
          onPress: () => {
            // Reset the tree data context
            if (context?.resetTreeData) {
              context.resetTreeData();
            }
            // Navigate back to TreeDataForm
            navigation.reset({
              index: 0,
              routes: [{ name: 'TreeDataForm' }],
            });
          }
        }]
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save data");
      console.error('Error in handleSave:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to pick an image from gallery
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to access photo library");
      console.error(error);
    }
  };

  // Function to take a photo using camera
  const takePhoto = async () => {
    try {
      // Request camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission denied", "Camera permission is required to take photos");
        return;
      }
      
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to access camera");
      console.error(error);
    }
  };

  return (
    <Container>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Upload Tree Image
        </Text>
        
        {image && (
          <Image
            source={{ uri: image }}
            style={{ width: 150, height: 150, borderRadius: 10, marginBottom: 10 }}
          />
        )}
        
        <UploadButton onPress={pickImage}>
          <Text style={{ fontSize: 16, color: "#4a7c59" }}>📁 Choose from Gallery</Text>
        </UploadButton>
        
        <UploadButton onPress={takePhoto}>
          <Text style={{ fontSize: 16, color: "#4a7c59" }}>📷 Take a Photo</Text>
        </UploadButton>
        
        <Button onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ButtonText>Save Data</ButtonText>
          )}
        </Button>
      </Card>
    </Container>
  );
}
