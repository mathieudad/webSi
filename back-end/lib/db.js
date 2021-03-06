
const { v4: uuid } = require('uuid')
const { clone, merge } = require('mixme')
const microtime = require('microtime')
const level = require('level')
const db = level(__dirname + '/../db')

module.exports = {
  channels: {
    create: async (channel, idOwner) => {
      if (!channel.name) throw Error('Invalid channel')
      if (!idOwner) throw Error('Invalid owner id')
      const id = uuid()
      await db.put(`channels:${id}`, JSON.stringify(merge(channel, { owner: idOwner })))
      return merge(channel, { id: id, owner: idOwner })
    },
    get: async (id) => {
      if (!id) throw Error('Invalid id')
      const data = await db.get(`channels:${id}`)
      const channel = JSON.parse(data)
      return merge(channel, { id: id })
    },
    list: async () => {
      return new Promise((resolve, reject) => {
        const channels = []
        db.createReadStream({
          gt: "channels:",
          lte: "channels" + String.fromCharCode(":".charCodeAt(0) + 1),
        }).on('data', ({ key, value }) => {
          channel = JSON.parse(value)
          channel.id = key.split(':')[1]
          channels.push(channel)
        }).on('error', (err) => {
          reject(err)
        }).on('end', () => {
          resolve(channels)
        })
      })
    },
    update: async (id, channel) => {
      if (!id) throw Error('Invalid channel id')
      const data = await db.get(`channels:${id}`)
      const original = JSON.parse(data)
      delete channel.id
      const newChannel = merge(original, channel)
      await db.put(`channels:${id}`,  JSON.stringify(merge(original, channel)))
      return merge(newChannel, { id: id })
    },
    delete: async (id) => {
      if (!id) throw Error('Invalid channel')
      try{
        await db.del(`channels:${id}`)
      }catch(err){
        throw err
      }
    }
  },
  messages: {
    create: async (channelId, message) => {
      if (!channelId) throw Error('Invalid channel')
      if (!message.author) throw Error('Invalid author')
      if (!message.content) throw Error('Invalid message')
      creation = microtime.now()
      await db.put(`messages:${channelId}:${creation}`, JSON.stringify({
        author: message.author,
        content: message.content
      }))
      return merge(message, { channelId: channelId, creation: creation })
    },
    update: async (channelId, messageId, message) => {
      if (!channelId) throw Error('Invalid channel')
      if (!message.author) throw Error('Invalid message author')
      if (!message.content) throw Error('Invalid message content')
      if (!messageId) throw Error('Invalid message creation')
      await db.put(`messages:${channelId}:${messageId}`, JSON.stringify({
        author: message.author,
        content: message.content
      }))
      return merge(message, { channelId: channelId, creation: messageId })
    },
    list: async (channelId) => {
      return new Promise((resolve, reject) => {
        const messages = []
        db.createReadStream({
          gt: `messages:${channelId}:`,
          lte: `messages:${channelId}` + String.fromCharCode(":".charCodeAt(0) + 1),
        }).on('data', ({ key, value }) => {
          message = JSON.parse(value)
          const [, channelId, creation] = key.split(':')
          message.channelId = channelId
          message.creation = creation
          messages.push(message)
        }).on('error', (err) => {
          reject(err)
        }).on('end', () => {
          resolve(messages)
        })
      })
    },
    delete: async (channelId, messageId) => {
      if (!channelId) throw Error('Invalid channel')
      if (!messageId) throw Error('Invalid message creation')
      try{
        await db.del(`messages:${channelId}:${messageId}`)
      }catch(err){
        throw err
      }
    },
  },
  users: {
    create: async (user, id) => {
      if (!user.name) throw Error('Invalid user')
      if (!id) throw Error('Invalid id')
      await db.put(`users:${id}`, JSON.stringify(user))
      await db.put(`userchannels:${id}`, JSON.stringify([]))
      await db.put(`usernames:${user.name}`, id)
      return merge(user, { id:  id})
    },
    get: async (id) => {
      if (!id) throw Error('Invalid id')
      try {
        const data = await db.get(`users:${id}`)
        const user = JSON.parse(data)
        return merge(user, { id: id })
      } catch (err) {
        //TODO Check error type
        return null
      }
    },
    getByName: async (userName) => {
      if (!userName) throw Error('Invalid id')
      try {
        const data = await db.get(`usernames:${userName}`)
        const email =  Buffer.from(data, 'base64').toString('utf-8') 
        return email
      } catch (err) {
        //TODO Check error type
        return null
      }
    },
    addChannel: async (id, idChannel) => {
      if (!id || !idChannel) throw Error('Invalid id')
      const data = await db.get(`userchannels:${id}`)
      let userChannels = JSON.parse(data)
      return db.put(`userchannels:${id}`, JSON.stringify([...userChannels, `channels:${idChannel}`]))
    },
    listChannels: async (id) => {
      if (!id) throw Error('Invalid id')
      const data = await db.get(`userchannels:${id}`)
      const channelsIds = JSON.parse(data)
      const channels = []
      await Promise.all(channelsIds.map(async channelId => {
        try{
          const dataChannel = await db.get(channelId)
          const channel = JSON.parse(dataChannel)
          channels.push(merge(channel, { id: channelId.split(":")[1] }))
        }catch(err){
          return err
        }
      }))
      return channels
    },
    deleteChannel: async (id, channelId) => {
      if (!id) throw Error('Invalid id')
      if (!channelId) throw Error('Invalid channel id')
      const data = await db.get(`userchannels:${id}`)
      console.log(channelId)
      const userChannels = JSON.parse(data)
      const newUserChannels = userChannels.filter(channel => `channels:${channelId}` != channel)
      db.put(`userchannels:${id}`, JSON.stringify(newUserChannels))
      return newUserChannels
    },
    list: async () => {
      return new Promise((resolve, reject) => {
        const users = []
        db.createReadStream({
          gt: "users:",
          lte: "users" + String.fromCharCode(":".charCodeAt(0) + 1),
        }).on('data', ({ key, value }) => {
          const user = JSON.parse(value)
          user.id = key.split(':')[1]
          users.push(user)
        }).on('error', (err) => {
          reject(err)
        }).on('end', () => {
          resolve(users)
        })
      })
    },
    update: async (id, user) => {
      const data = await db.get(`users:${id}`)
      const original = JSON.parse(data)
      delete user.id
      const newUser = merge(original, user)
      await db.put(`users:${id}`, JSON.stringify(merge(original, newUser)))
      return merge(newUser, { id: id })
    },
    delete: async (id) => {
      if (!id) throw Error('Invalid user id')
      try{
        await db.del(`users:${id}`)
      }catch(err){
        throw err
      }
    }
  },
  settings: {
    get : async (idUser) => {
      if (!idUser) throw Error('Invalid id')
      try {
        const data = await db.get(`usersettings:${idUser}`)
        const settings = JSON.parse(data)
        return settings
      } catch (err) {
        //TODO Check error type
        return null
      }
    },
    put : async (idUser, settings) => {
      try{
        const data = await db.get(`usersettings:${idUser}`)
        const originals = JSON.parse(data)
        await db.put(`usersettings:${idUser}`, JSON.stringify(merge(originals, settings)))
        return settings
      }catch(err){ //If there were no settings for the user, we create them
        //TODO check error type
        await db.put(`usersettings:${idUser}`, JSON.stringify(settings))
        return settings
      }
    }
  },
  admin: {
    clear: async () => {
      await db.clear()
    }
  }
}
