
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, FlatList, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Modal from "react-native-modal"
import axios from 'axios';


const MAX_SCORES = 5;
const SCORES_KEY = 'scores';


const API_URL = 'https://scoreapp-850e3-default-rtdb.asia-southeast1.firebasedatabase.app/scores.json';

const ScoreScreen = () => {
    const [score, setScore] = useState('');
    const [scores, setScores] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    // Check network connectivity
    const [isConnected, setIsConnected] = useState(true);

    const handleConnectivityChange = (isConnected) => {
        setIsConnected(isConnected);
        if (isConnected) {
            uploadLocalScores();
            fetchScores();
        }
    };

      useEffect(() => {
        fetchScores();
    }, []);


    useEffect(() => {
        //   fetchScores();
        const unsubscribe = NetInfo.addEventListener((state) => {
            handleConnectivityChange(state.isConnected);
        });

        // Load scores from AsyncStorage
        const loadData = async () => {
            const data = await AsyncStorage.getItem(SCORES_KEY);
            if (data) {
                setScores(JSON.parse(data));
            }
        };
        loadData();

        return () => {
            unsubscribe();
        };
    }, []);

    const saveScore = async () => {
        if (score === '') {
            Alert.alert('Please enter score');
            return;
        }
    
        const scoreNumber = Number(score);
        if (isNaN(scoreNumber)) {
            Alert.alert('Please enter a valid score');
            return;
        }
    
        const newScores = [...scores, scoreNumber].slice(-MAX_SCORES);
    
        try {
            if (isConnected) {
                await saveScoreToAPI(scoreNumber);
                Alert.alert('Score saved in server');
            } else {
                await saveScoreLocally(scoreNumber);
                Alert.alert('Score saved locally');
            }
            await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(newScores));
            setScores(newScores);
            setScore('');
        } catch (error) {
            console.log('Error saving score: ', error);
        }
    };
    

    const saveScoreToAPI = async (score) => {
        try {
            await axios.post(API_URL, { score });
        } catch (error) {
            console.log('Error saving score to API: ', error);
        }
    };



    const saveScoreLocally = async (score) => {
        try {
          const localScores = await AsyncStorage.getItem(SCORES_KEY);
          let newLocalScores = [];
          if (localScores) {
            const parsedScores = JSON.parse(localScores);
            if (Array.isArray(parsedScores)) {
              newLocalScores = [...parsedScores, score].slice(-MAX_SCORES);
            } else {
              newLocalScores.push(score);
            }
          } else {
            newLocalScores.push(score);
          }
          await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(newLocalScores));
        } catch (error) {
          console.log('Error saving score locally: ', error);
        }
      };
      

    const uploadLocalScores = async () => {
        try {
            const localScores = await AsyncStorage.getItem(SCORES_KEY);
            if (localScores) {
                const scoresArray = JSON.parse(localScores);
                await Promise.all(scoresArray.map((score) => saveScoreToAPI(score)));
                await AsyncStorage.removeItem(SCORES_KEY);
                setScores(scoresArray.slice(-MAX_SCORES));
                Alert.alert('Local scores uploaded successfully');
            }
        } catch (error) {
            console.log('Error uploading local scores: ', error);
        }
    };



    const fetchScores = async () => {
        try {
            const response = await axios.get(API_URL);
            const scoresData = response.data;
            setScores(scoresData);
            console.log(scores);
        } catch (error) {
            console.log('Error fetching data',error);
        }
    };

    // useEffect(() => {
    //     fetchScores();
    // }, []);





    const toggleModal = () => {
        setModalVisible(!modalVisible);
    };



    return (
        <View style={styles.container}>
            <View style={styles.navView}>
                <TouchableOpacity style={styles.modalButton} onPress={toggleModal}>
                    {/* <Ionicons name="ios-menu" size={32} color="white" /> */}
                    {/* <Text>Button</Text> */}
                    <Image style={styles.modalButton}
        source={require('../assests/Images/menu.png')}/>
                </TouchableOpacity></View>

            <Text style={styles.title}>Enter score:</Text>
            <View style={styles.inputView}>
                <TextInput
                    keyboardType='number-pad'
                    style={styles.inputText} value={score} onChangeText={setScore} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveScore}>
                <Text style={styles.saveText}>SAVE</Text>
            </TouchableOpacity>

            {scores.length > 0 && (
                <View style={styles.scoresContainer}>
                    <View style={styles.scoresTitleView}>
                        <Text style={styles.scoresTitle}>Max {MAX_SCORES} Scores:</Text>
                    </View>
                    <View style={styles.modalView}>




                        <Modal visible={modalVisible} onBackdropPress={toggleModal} transparent={true} animationType="slide">
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle}>High Scores:</Text>
                                <FlatList
                                    data={scores}
                                    keyExtractor={(item) => item.toString()}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.scoreItem}>
                                            <Text style={styles.scoreText}>{index + 1}. {item}</Text>
                                        </View>
                                    )}
                                />
                                <TouchableOpacity style={styles.modalCloseButton} onPress={toggleModal}>
                                    <Text style={styles.modalCloseButtonText}>CLOSE</Text>
                                </TouchableOpacity>
                            </View>
                        </Modal>

                    </View>


                </View>
            )}

            {!isConnected && <Text style={styles.offlineText}>Offline mode</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222222',

        alignItems: 'center',
        // justifyContent: 'center',
    },
    navView: {
        backgroundColor: '#FFA500',
        width: '100%',
        height: 50,
        justifyContent: 'center',
        //  alignItems:'center'
    },
    modalButton: {
        //  backgroundColor:'red',
        width: '30%',
        height: '75%',
        justifyContent: 'center',
        //  alignItems:'center',
        marginLeft: 8


    },
    title: {
        fontWeight: 'bold',
        fontSize: 50,
        color: '#ffffff',
        marginBottom: 40,
        marginTop: 20
    },
    inputView: {
        width: '80%',
        backgroundColor: '#333333',
        borderRadius: 25,
        height: 50,
        marginBottom: 20,
        justifyContent: 'center',
        padding: 20,
    },
    saveBtn: {
        width: '80%',
        backgroundColor: '#FFA500',
        borderRadius: 25,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    saveText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    scoresContainer: {
        // marginTop: 20,

        // alignItems: 'center',
        // justifyContent: 'center',
        //  flexDirection:'row',
        // backgroundColor: 'red',
        height: '10%',
        // width: '50%'
    },
    scoresTitleView: {
        //  backgroundColor: "purple",
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        alignItems: 'center'
    },
    scoresTitle: {
        fontSize: 18,
        color: '#fff',
        // marginBottom: 10,
        alignContent: 'center',
        alignItems: 'center'
    },
    scoreView: {
        // backgroundColor: 'blue',

        // flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWscoreth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        // flexDirection:'row'

    },
    score: {
        color: '#fff',
        // flexDirection: 'row',
        width: '100%'

    },
    inputText: {
        height: 50,
        color: '#ffffff',
    },
    offlineText: {
        color: 'red',
        // backgroundColor:'red'
        marginTop: 10

    },
    scoreList: {
        marginTop: 20,
        width: '50%',
        // marginBottom:20
        // justifyContent:'space-evenly'
        //alignItems:'center'
    },
    scoreItem: {
        padding: 10,
        borderBottomWidth: 3,
        borderBottomColor: '#ccc',
        borderRightWidth: 1,
        borderRightColor: '#ccc',
        borderLeftWidth: 1,
        borderLeftColor: '#ccc',
        // justifyContent: 'center',
        // alignItems: 'center',
        marginBottom: 10,
        borderRadius: 25,
        // backgroundColor:'red',
        width: 200

    },
    scoreText: {
        fontSize: 18,
    },
    flatListContentContainer: {
        // justifyContent:'center',
        // alignItems:'stretch',
        // flexDirection:'row-reverse'

    },
    modalView: {
        // flex:1,
        backgroundColor: 'red',
        justifyContent: 'center',
        width: '100%',
        // marginTop:30
        alignContent: 'center',
        alignItems: 'center',
        // height:'100%'
    },
    modalContainer: {
        // flex:1,
        height: '50%',
        //marginTop:'90%',
        backgroundColor: '#FFA500',
        // justifyContent:'center',
        alignItems: 'center',
        borderRadius: 50,
        // borderRadius:2,
        borderTopColor: 'red',
        width: '100%',
        // marginLeft:"50%"
        alignContent: 'center'

    },
    modalTitle: {
        fontSize: 18,
        color: '#fff',
        // marginBottom: 10,
        alignContent: 'center',
        alignItems: 'center'
    },
    modalCloseButtonText: {
        color: 'red',
        marginBottom:15
    }
});
export default ScoreScreen;