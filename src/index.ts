import { server } from './configs'

const str = 'Crème Brulée'
str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
console.log(str)
server.start()
