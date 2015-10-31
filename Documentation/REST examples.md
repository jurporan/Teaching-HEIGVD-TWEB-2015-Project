# Exemples de l'utilisation de l'interface REST
GET ```/api/poll```
---------------

```
GET /api/poll HTTP/1.1
Host: localhost:3000
Accept: application/json

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 41

{"nb_open":0,"nb_closed":0,"nb_recent":0}
```

POST ```/api/poll```
------------------

```
POST /api/poll HTTP/1.1
Host: localhost:3000
Content-Type: application/json; charset=UTF-8
Content-Length: 107

{
   "name" : "TWEB - Questionnaire n..1",
   "creator" : "QPoll staff",
   "admin_password" : "tweb1234"
}

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 33

{"id":"5634abe6e4530b2459ce91e5"}
```