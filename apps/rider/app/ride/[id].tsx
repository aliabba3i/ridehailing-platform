import React, { useEffect, useState } from 'react';
import { View,Text,Pressable,Alert,ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { io } from 'socket.io-client';
import { api, restoreSession } from '../../src/session';
type Detail = { id:string; status:string; fare:number; driverId:string|null; rating?:{score:number}|null };
export default function RideDetail(){
 const {id}=useLocalSearchParams<{id:string}>(),[ride,setRide]=useState<Detail|null>(null),[score,setScore]=useState(5);
 const load=async()=>{try{setRide(await api.request<Detail>('/rides/'+id))}catch(e){Alert.alert('Error',String(e))}};
 useEffect(()=>{let socket:ReturnType<typeof io>|undefined;restoreSession().then(token=>{if(!token)return;load();socket=io((process.env.EXPO_PUBLIC_API_URL||'http://localhost:4000'),{auth:{token}});socket.emit('ride:join',id);socket.on('ride:updated',load)});return()=>{socket?.disconnect()}},[id]);
 const action=async(path:string,body:unknown={})=>{try{await api.request('/rides/'+id+path,{method:'POST',body:JSON.stringify(body)});await load()}catch(e){Alert.alert('Error',String(e))}};
 return <View style={{padding:22,gap:12}}><Text style={{fontSize:26,fontWeight:'bold'}}>Ride tracking</Text>{!ride?<ActivityIndicator/>:<><Text>Status: {ride.status}</Text><Text>Fare: {ride.fare.toLocaleString()} IRR</Text><Text>Driver: {ride.driverId||'Searching'}</Text>{['REQUESTED','SEARCHING','ACCEPTED','ARRIVING','ARRIVED'].includes(ride.status)?<Pressable onPress={()=>action('/cancel')}><Text style={{color:'red'}}>Cancel ride</Text></Pressable>:null}{ride.status==='COMPLETED'&&!ride.rating?<><Text>Rate your driver</Text><Pressable onPress={()=>setScore(score===5?1:score+1)}><Text style={{fontSize:22}}>{'★'.repeat(score)} ({score}/5) — tap to change</Text></Pressable><Pressable onPress={()=>action('/rating',{score})}><Text>Submit rating</Text></Pressable><Pressable onPress={()=>api.request('/payments/'+id+'/pay',{method:'POST'}).then(()=>Alert.alert('Mock payment','Payment marked successful')).catch(e=>Alert.alert('Error',String(e)))}><Text>Pay with mock provider</Text></Pressable></>:null}</>}</View>
}
