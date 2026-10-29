import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function makerworldDevPlugin(): Plugin {
  return {
    name: 'makerworld-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/makerworld/parse' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { url } = JSON.parse(body || '{}');
              if (!url || !url.toLowerCase().includes('makerworld.com')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(
                  JSON.stringify({
                    error: 'Apenas links oficiais da plataforma MakerWorld são aceitos.',
                  })
                );
              }

              const matchId = url.match(/models\/(\d+)/i);
              if (!matchId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(
                  JSON.stringify({
                    error: 'ID do modelo não encontrado na URL. Formato esperado: makerworld.com/.../models/{id}...',
                  })
                );
              }
              const modelId = matchId[1];
              const matchProfile = url.match(/profileId[-=](\d+)/i);
              const requestedProfileId = matchProfile ? Number(matchProfile[1]) : null;

              const apiRes = await fetch(
                `https://api.bambulab.com/v1/design-service/design/${modelId}`,
                {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    Accept: 'application/json',
                  },
                }
              );

              if (!apiRes.ok) {
                res.statusCode = apiRes.status;
                res.setHeader('Content-Type', 'application/json');
                return res.end(
                  JSON.stringify({
                    error: `Modelo #${modelId} não encontrado no MakerWorld.`,
                  })
                );
              }

              const d = await apiRes.json();
              const rawInstances = Array.isArray(d.instances) ? d.instances : [];

              const instances = rawInstances.map((inst: any) => {
                const seconds = Number(inst.prediction) || 0;
                const totalHours = seconds / 3600;
                const printDays = Math.floor(totalHours / 24);
                const remainingHours = totalHours % 24;
                const printHours = Math.floor(remainingHours);
                const printMinutes = Math.round((remainingHours - printHours) * 60);

                const filaments = (inst.instanceFilaments || []).map((f: any) => ({
                  type: (f.type || 'PLA').toUpperCase(),
                  color: f.color || '#3b82f6',
                  usedG: Number(f.usedG) || 0,
                  usedM: Number(f.usedM) || 0,
                }));

                const compatList: string[] = [];
                if (inst.extention?.modelInfo?.compatibility?.devProductName) {
                  compatList.push(inst.extention.modelInfo.compatibility.devProductName);
                }
                if (Array.isArray(inst.extention?.modelInfo?.otherCompatibility)) {
                  inst.extention.modelInfo.otherCompatibility.forEach((c: any) => {
                    if (c.devProductName && !compatList.includes(c.devProductName)) {
                      compatList.push(c.devProductName);
                    }
                  });
                }

                return {
                  id: inst.id,
                  title: inst.title || 'Perfil de Impressão',
                  predictionSeconds: seconds,
                  totalHours,
                  printDays,
                  printHours,
                  printMinutes,
                  weightGrams: Number(inst.weight) || 0,
                  platesCount: inst.extention?.modelInfo?.plates?.length || 1,
                  nozzleDiameter: inst.extention?.modelInfo?.compatibility?.nozzleDiameter || 0.4,
                  compatibilityPrinters: compatList,
                  filaments,
                  isDefault: Boolean(inst.isDefault || inst.id === d.defaultInstanceId),
                };
              });

              let selectedInstance = null;
              if (requestedProfileId) {
                selectedInstance = instances.find((i: any) => i.id === requestedProfileId);
              }
              if (!selectedInstance) {
                selectedInstance = instances.find((i: any) => i.isDefault) || instances[0];
              }

              const result = {
                designId: Number(modelId),
                title: d.title || 'Modelo MakerWorld',
                coverUrl: d.coverUrl || (instances[0]?.cover || ''),
                creatorName: d.designCreator?.name || 'Designer MakerWorld',
                creatorAvatar: d.designCreator?.avatar || '',
                instances,
                selectedInstance,
                sourceUrl: url,
              };

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({ error: 'Erro ao processar MakerWorld: ' + err.message })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    makerworldDevPlugin(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'https://bagrelab.pampo.tech',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
