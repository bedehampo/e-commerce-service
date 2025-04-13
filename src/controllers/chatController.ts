// import agoraToken from 'agora-token'
// import { NextFunction } from 'express'
// import { RtcTokenBuilder, RtcRole } from 'agora-token'
// import { ServiceError } from '../errors'

// const appId: any = process.env.AGORA_APP_ID
// const appCertificate: any = process.env.AGORA_CERTIFICATE

// // Generate token
// export const generateAgoraToken = async (req: any, res: any, next: NextFunction) => {
//   // Set response header
//   res.header('Access-Control-ALlow-Origin', '*')

//   // Get channel Name
//   const channelName: any = req.query.channelName
//   if (!channelName) {
//     return next(new ServiceError('Channel is required'))
//   }
//   // Get uid
//   let uid: any = req.query.uid
//   if (!uid || uid === '') {
//     uid = 0
//   }

//   // Get role
//   let role = RtcRole.SUBSCRIBER
//   if (req.query.role === 'publisher') {
//     role = RtcRole.PUBLISHER
//   }

//   // Get the expiry time
//   let expireTime: any = req.query.expireTime
//   if (!expireTime) {
//     expireTime = 3600
//   } else {
//     expireTime = parseInt(expireTime, 10);
//   }

//   // Calculate privilege expiry time
//   const currentTime = Math.floor(Date.now() / 1000);
//   const privilegeExpiryTime = currentTime + expireTime

//   // Build the token
//   const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, expireTime, privilegeExpiryTime);
  
//   // return the token
//   return res.json({
//     "token": token
//   });
// }