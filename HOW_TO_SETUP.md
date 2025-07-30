# Set up environment variables

Create .env.production using .env.production.traefik as a template

### Initialize witnesses’ configuration
```bash
docker compose \
    --profile witness-init \
    --env-file .env.production \
    -f docker-compose.production.traefik.yaml \
    up
```

### Boot up witnesses
```bash
docker compose \
    --profile witness \
    --env-file .env.production \
    -f docker-compose.production.traefik.yaml \
    up -d
```

### Initialize KERIA’s configuration
#### Generate a fresh KERIA_PASSCODE and update the value
```bash
KERIA_PASSCODE=$(docker run -it --rm cardanofoundation/cf-keria-passcode-gen | sed 's/\r//g')
sed -i "s/^KERIA_PASSCODE=.*/KERIA_PASSCODE=$KERIA_PASSCODE/" .env.production
```

#### Gather witnesses’ OOBIs and check that they all (0-5)
```bash
export PUBLIC_DOMAIN='hansajayathilaka.com'
# Generate KERIA_IURLS for all witnesses
export KERIA_IURLS=$(INITIAL_PORT=5642; for wit in $(seq 0 5); do \
  OOBI=$(docker compose -f docker-compose.production-traefik.yaml logs witness-$wit 2>/dev/null | grep Witness.wit | awk '{print $NF}'); \
  echo "https://witness-$wit.${PUBLIC_DOMAIN}/oobi/${OOBI}/controller?role=witness"; \
done | xargs echo)

echo $KERIA_IURLS
```

#### Setup KERIA’s configuration
```bash
docker compose \
    --profile keria-init \
    --env-file .env.production \
    -f docker-compose.production.traefik.yaml \
    up
```

### Boot up the rest of the services
```bash
docker compose \
    --profile production \
    --env-file .env.production \
    -f docker-compose.production.traefik.yaml \
    up -d
```

#### Boot up the credential issuance service
```bash
docker compose \
    --profile production \
    --env-file .env.production \
    -f docker-compose.production.traefik.yaml \
    up cred-issuance --build -d
```
#### Boot up the credential issuance UI service
```bash
docker compose \
    --profile production \
    --env-file .env.production \
    -f docker-compose.production.traefik.yaml \
    up cred-issuance-ui --build -d
```
#### Boot up the wallet service
```bash
docker compose \
    --profile production \
    --env-file .env.production \
    -f docker-compose.production.traefik.yaml \
    up wallet --build -d
```
