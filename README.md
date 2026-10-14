# Appliance Remote

A web app (React + TypeScript + Vite) for switching appliances on and off
through internet-connected devices.

**Phase 1** runs against a *fake* device fleet, so you can build and test
everything with no hardware. Later, `FakeTransport` is swapped for an MQTT
transport and nothing else changes.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # type-check + production build into dist/
```

## Layers

```
UI        src/features, src/app          React components (.tsx)
State     src/state                      zustand store: what the app believes
Domain    src/domain                     types + the message contract (.ts)
Services  src/services/transport         DeviceTransport interface + implementations
```

Each layer only calls the one below it. Components never touch the network.

## Key rule

A device is only shown as ON or OFF after the **device confirms it**.
Every command is `pending`, then `confirmed`, `failed` or `timeout`.
If the app does not know, it says `unknown`.

## Try the failure cases

Open the **Dev panel** at the bottom of the page to take the device offline,
cut the app's internet, make the device ignore commands (timeout), or press
the "physical button".

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` sets `BASE_PATH` to the
repository name automatically. In the repo settings, set
Pages > Source to **GitHub Actions**.
