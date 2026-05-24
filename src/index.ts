import "dotenv/config"
import { app } from "./app"
import {env} from "./config/env"

app.listen(env.PORT);

console.log("Сервер запущений. Для того щоб його виключити нажми 'ctrl + C'")

//console.log(process.env.DATABASE_URL);

//console.log(env);