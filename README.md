# MLBB PLAY

Монгол дахь Mobile Legends: Bang Bang тоглогчдод зориулсан FACEIT-style
өрсөлдөөнт платформ. `mlbb_version1` демо төслийн залгамжлагч — архитектурыг
цэвэрхэн дахин эхлүүлж байна.

## Бүтэц

```
mlbb_play/
├── common/                  # Хуваалцсан Mongoose схем + DB helper
├── services/
│   ├── api-gateway/          # Нэг цэгээс бусад service рүү proxy хийдэг
│   ├── matchmaking-service/   # ELO-based queue (Redis) — Phase 1
│   └── mmr-service/           # ELO/MMR тооцоолол — Phase 1
├── frontend/                 # React + Vite + Tailwind (cyber/glass дизайн)
└── docker-compose.yml         # MongoDB + Redis (dev)
```

`matchmaking-service` (Redis-based ELO queue, snake-draft team
balancing, accept/decline lobby flow) болон `mmr-service` (динамик
ELO/MMR томъёо, rank tier дэвших/буурах, ELO түүх) хоёулаа бодит
ажиллагаатай. `matchmaking-service`-ийн үндсэн логикийг бодит Redis
эсрэг шалгасан:

```bash
npm run smoke -w services/matchmaking-service
```

`mmr-service`-ийн ELO томъёог unit тестээр баталгаажуулсан:

```bash
npm test -w services/mmr-service
```

## Ажиллуулах

```bash
npm install
docker-compose up -d      # MongoDB + Redis

npm run dev:gateway       # :3000
npm run dev:matchmaking   # :3002
npm run dev:mmr           # :3003
npm run dev:frontend      # :5173
```

## Дизайны систем

Frontend-ийн Tailwind токен, өнгө, глассморфизм классууд (`cyber-card`,
`cyber-button`, `.glass`, rank өнгөнүүд гэх мэт) нь `mlbb_version1`
демо төслөөс шууд авсан — брэндийн тасралтгүй байдлыг хадгалав.

## Дараагийн алхам

1. `auth-service` нэмж, `identify` socket event-д JWT баталгаажуулалт
   оруулах (одоогоор client-ийн өгсөн userId-д итгэж байгаа), мөн
   `join_queue`-д ирж буй ELO-г client-аас биш DB-ээс уншиж эхлэх
   (одоогийн Phase 1-ийн зохион мэдэгдсэн хязгаарлалт)
2. Match тоглогдсоны дараа `/api/v1/mmr/calculate`-г дуудах бодит
   эх сурвалж (тоглолтын үр дүн мэдээлэх систем) нэмэх — Phase 4-ийн
   Dispute/verification системтэй холбогдоно
3. Pick/Ban lobby (Phase 2) — `LOBBY_READY`-ийн дараах алхам

## Frontend-ийг matchmaking-service-тэй хамт ажиллуулж туршиж үзэх

```bash
docker-compose up -d          # MongoDB + Redis
npm run dev:matchmaking       # :3002 — эхлээд эхэлсэн байх ёстой
npm run dev:frontend          # :5173
```

Хөгжүүлэлтийн үед 10 бодит хэрэглэгч цуглуулах шаардлагагүй —
"Тоглолт хайх" дараад **"9 бот нэмэх"** товч дээр дарахад бүтэн
матч (5v5, тэнцвэртэй ELO-той) шууд олдоно. Энэ товч зөвхөн dev
орчинд идэвхтэй (`NODE_ENV !== "production"`), диплом хамгаалалт дээр
амьд демо хийхэд зориулагдсан.
