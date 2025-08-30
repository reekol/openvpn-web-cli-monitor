
let ADDRESS = (process.env.ADDRESS ? process.env.ADDRESS : "127.0.0.1:7505").split(':')

const commands = [ "status 3\n","exit\n" ];
const GENERIC = 'GENERIC'
const d = console.log
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
var net = require('net')
var express = require('express')
var Table = require('cli-table3');
var Convert = require('ansi-to-html')
var convert = new Convert()

let tables = []; tables[GENERIC];
let RSP = ''
let OUTPUT = ''

let tablesInit = () => {
	tables = []
	tables[GENERIC] = { table: new Table(), headerTypes: [] }
}

let getHeaderTypes = (header) => {
	let types = []
	for(let i in header){
		types[i] = a => a
		if((header[i]).indexOf('time_t') != -1){
			types[i] = a => '_SIZE:3'
		}
		// if((header[i]).indexOf('Real,') != -1){
		// 	types[i] = a => '_SIZE:3'
		// }
		if((header[i]).indexOf(',Cipher') != -1){
			types[i] = a => '_SIZE:3'
		}
		if((header[i]).indexOf('CLIENT_LIST') != -1){
			types[i] = a => '_SIZE:3'
		}
		if((header[i]).indexOf('ROUTING_TABLE') != -1){
			types[i] = a => '_SIZE:3'
		}
		if((header[i]).indexOf('IPv6') != -1){
			types[i] = a => '_SIZE:3'
		}
		if((header[i]).indexOf('Username') != -1){
			types[i] = a => '_SIZE:3'
		}
	}
	return types
}


(async () => {

	let conn

	let onPrompt = async () => {
			OUTPUT = '', RSP = ''
			for (let command of commands){
				await delay(200)
				conn.write(command)
			}
		}
	let onData = (data) => {
			if (data.indexOf(">") != -1) {
				conn.emit('prompt')
				return
			}
			RSP += data
		}

	let onConnect = () => {}

	let onClose = ()=>{

				let data = RSP.split("\r").map( row => (row.split("\t").map(a => a == '' ? ',' : a.split(' ').join(',').trim()).filter(a => a)))
				let hookName = ''
				for (let row of data){
					if(row[0] == 'HEADER'){
						hookName = row[1]
						delete row[0]
						row = new Array(row.filter(a => a))
						let headerTypes = getHeaderTypes(row[0])
						let colWidths = []
						for(let ht in headerTypes){
							colWidths[ht] = null
							if(headerTypes[ht].toString().indexOf('_SIZE') != -1){
								colWidths[ht] = parseInt(headerTypes[ht].toString().split(':').pop())
							}
						}
						tables[hookName] = {
							table : new Table({ head: row[0], colWidths: colWidths }),
							headerTypes: headerTypes
						}
					}else if(row[0] === hookName){
						tables[hookName].table.push(
							row.map( (c, i) =>  tables[hookName].headerTypes[i](c) )
						)
					}else{
						tables[GENERIC].table.push(row)
					}
				}

				OUTPUT = ''
				for(let tableName in tables){
					OUTPUT += tableName + '\n'
					OUTPUT += tables[tableName].table.toString() + '\n'
				}
				d(OUTPUT)
	}

	let getVpnStats = async () => {
		tablesInit()
		conn = net.createConnection(ADDRESS[1], ADDRESS[0])
		conn.setEncoding('ascii')

		conn.on('prompt', onPrompt)
		conn.on('data', onData)
		conn.on('close', onClose)
		conn.on('close', () => setTimeout(getVpnStats,5000))
		conn.on('connect', onConnect)
		return conn
	}

	getVpnStats()

})()



var app = express()
	app.listen(8080, function() {console.log('Listening')})
	app.get('/',function(req,res){
		res.send(
			"<html><body style='color:#fff;background:#000;padding:5px;margin:0' >"
			+ "<div>"
			+ "<PRE>"
			+ convert.toHtml(OUTPUT)
			+ "</PRE>"
			+ "</div>"
			+ "</body></html>"
		)
	})


