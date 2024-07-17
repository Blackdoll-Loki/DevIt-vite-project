check: 
		docker compose config
up:	check
		docker compose up -d
ps:
		docker compose ps -a
stop:
		docker compose stop node
start:
		docker compose up -d node
run:stop
		docker compose run --rm -v ./sourse:/app -p 3000:3000 -p 3001:3001 node bash
		make start
exec:
		docker compose exec node bash