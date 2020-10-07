'use strict';
//require('dotenv').config();
const path = require('path');
global.g_svrRoot = path.resolve(__dirname);
// global.g_config = require(`${g_svrRoot}/config.json`);
const WebSocket = require('ws');
const btoa = require('btoa');
const axios = require('axios');
var strUser = 'dylan.changs@gmail.com'		//Account
var strPasswod = 'Wisepaas1/'					//Password
var strPortal = 'deviceon.wise-paas.com'	//Portal
var strLanguage = 'en-US'					//Content language
//en-US
var strURL = 'wss://' + strPortal + '/event/' + strLanguage + '/' + btoa(strUser + ":" + strPasswod)
var oWS = new WebSocket(strURL)
oWS.onopen = (evt) => {
    insertData('WebSocket Connection open ...')
}
oWS.onmessage = (evt) => {
    receiveData(evt.data)
}
oWS.onclose = (evt) => {
    insertData('DeviceOn WebSocket Connection closed.')
}
const insertData = (strData) => {
    console.log(strData)
}
const receiveData = (strData) => {
    let jsonData = {};
    try {
        jsonData = JSON.parse(strData)
    } catch {
    }
    // if (jsonData.event[0].subtype==='SET_DEVICE_SENSOR_VALUE')
    //console.log(jsonData)
    let evtAry = jsonData.events;
    evtAry.map((item) => {
        //    console.log(item);
        tranData(item);
        // (item.severity_desc === 'Error'&&item.agent_name!=="ARK-1124_Homer_test") ? tranData(item) : '';
    })
}
console.log(`***Agent Service Startup***`);
const getDate = () => {
    var Today = new Date();
    var yyyy = Today.getFullYear().toString();
    var mm = (Today.getMonth() + 1).toString();
    var dd = Today.getDate().toString();
    var thisDate = yyyy + "" + (mm[1] ? mm : "0" + mm[0]) + "" + (dd[1] ? dd : "" + dd[0])
    return thisDate;
}
const getTime = () => {
    let Today = new Date();
    let HH = Today.getHours().toString();
    let mm = (Today.getMinutes()).toString();
    let ss = Today.getSeconds().toString();
    let thisTime = (HH[1] ? HH : "0" + HH[0]) + "" + (mm[1] ? mm : "0" + mm[0]) + "" + (ss[1] ? ss : "" + ss[0])
    return thisTime;
}
const accAuthRequest = axios.create({
    baseURL: 'http://phm.580440.com.cn/51794/s/',
});
const GetUserInfo = async (uid) => {
    return accAuthRequest.post(`/Signin/`, {
        "Id": "ZNKJ001",
        "Password": "e10adc3949ba59abbe56e057f20f883e"
    })
        .then(res => res.data.o)
        .then(data => {
            return JSON.parse(JSON.stringify(data[0]));
        }).catch((err) => {
            console.log(err)
        })
}
const tranData = async (data) => {
    let userInfo = await GetUserInfo();
    let fixData =
    {
        "eventType": 2, //int, 1:保養 2:報修
        "eventID": `DVON-${getDate()}${getTime()}`, //string, 事件ID, PK
        "deviceID": `00000001-0000-0000-0000-9C4E363DB96C`, //string, 装置ID
        "errorCode": [`${data.subtype}`], //string array, 错误代码
        "description": [`${data.message}`], //string
        "priority": 1, //int, 要求时限
        "timestamp": 1567650600 //int64, 时间标记
    }

    const regex = RegExp('Mute Switch');////////EVENT///////////////////
    if (regex.test(data.message)) {
        console.log('\nmatch-event:', data.message)
        axios({
            headers: { 'Passport': `${userInfo.Passport}` },
            method: 'POST',
            url: 'http://phm.580440.com.cn:8090/dev/error',
            data: fixData
        }).then((res) => {
            console.log(res.data);
        }).catch((err) => {
            console.log(err)
        })
    } else {
        console.log('\nnon-match-event:', data.message)
    }
}