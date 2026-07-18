import { loadCesium, type Cesium } from './loadCesium';
import type { Poi } from '../types';
import type { SelectedFeature, ViewMode, CameraMode } from '../store';
import { MUNICIPALITIES, REGION_CENTER } from '../data/municipalities';
import { POINTS_OF_INTEREST } from '../data/pointsOfInterest';
import { SKYTRAIN_LINES } from '../data/skytrain';

const POI_COLORS: Record<string, string> = {
  airport: '#7cc4ff',
  port: '#8fd6b4',
  landmark: '#ffd166',
  hospital: '#ff6b6b',
  university: '#c792ea',
  bridge: '#f4a261',
  park: '#6ee7a0',
  'transit-hub': '#4dd0e1',
  stadium: '#ffb4a2',
};

const POI_GLYPH: Record<string, string> = {
  airport: '✈',
  port: '⚓',
  landmark: '★',
  hospital: '✚',
  university: '🎓',
  bridge: '︿',
  park: '🌲',
  'transit-hub': '⊕',
  stadium: '◈',
};

/**
 * Encapsulates all imperative CesiumJS state for the Metro Vancouver twin:
 * viewer lifecycle, layer entity collections, imagery/terrain modes,
 * environment (time/lighting/weather), simulation overlays, picking, and
 * camera control. React components drive it through a small method surface.
 */
export class TwinViewer {
  private Cesium!: Cesium;
  private viewer: any;
  private hasToken = false;

  // Entity collections keyed by layer id.
  private collections: Record<string, any> = {};
  private buildingTileset: any = null;
  private worldTerrain: any = null;
  private flatTerrain: any = null;
  private seaLevelEntity: any = null;
  private imageryLayers: Record<string, any> = {};

  private orbitListener: (() => void) | null = null;
  private clickHandler: any = null;
  private measurePoints: any[] = [];
  private measureMode: 'none' | 'distance' | 'area' = 'none';
  private measureEntities: any[] = [];

  onSelect: ((f: SelectedFeature | null) => void) | null = null;

  get initialised() {
    return !!this.viewer;
  }
  get tokenAvailable() {
    return this.hasToken;
  }

  async init(container: HTMLElement, token: string | undefined): Promise<void> {
    const Cesium = await loadCesium();
    this.Cesium = Cesium;
    this.hasToken = !!token;
    if (token) Cesium.Ion.defaultAccessToken = token;

    // Terrain: world terrain when a token is present, flat ellipsoid otherwise.
    this.flatTerrain = new Cesium.EllipsoidTerrainProvider();
    let terrain = this.flatTerrain;
    if (token) {
      try {
        this.worldTerrain = await Cesium.createWorldTerrainAsync({
          requestVertexNormals: true,
          requestWaterMask: true,
        });
        terrain = this.worldTerrain;
      } catch {
        /* fall back to flat terrain */
      }
    }

    this.viewer = new Cesium.Viewer(container, {
      terrainProvider: terrain,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      requestRenderMode: false,
    });

    const scene = this.viewer.scene;
    scene.globe.enableLighting = true;
    scene.globe.depthTestAgainstTerrain = true;
    scene.fog.enabled = true;
    scene.skyAtmosphere.show = true;
    if (scene.postProcessStages) {
      scene.postProcessStages.fxaa.enabled = true;
    }
    // Hide the default Cesium credit clutter a little.
    this.viewer.cesiumWidget.creditContainer.style.display = 'none';

    this.setupImagery();
    this.buildLayers();
    this.setupPicking();

    // Initial camera: an oblique regional overview.
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(REGION_CENTER[0], 48.9, 55000),
      orientation: {
        heading: Cesium.Math.toRadians(20),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
    });
  }

  // ---- Imagery / view modes -------------------------------------------------

  private setupImagery() {
    const Cesium = this.Cesium;
    const layers = this.viewer.imageryLayers;
    layers.removeAll();

    // OpenStreetMap is always available (no token required).
    this.imageryLayers.streets = layers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      }),
    );

    // Satellite/photorealistic imagery: Cesium Ion asset 3 (Bing Aerial) when
    // a token exists; otherwise reuse OSM as a graceful fallback.
    this.applyViewMode('photorealistic');
  }

  async applyViewMode(mode: ViewMode) {
    const Cesium = this.Cesium;
    const layers = this.viewer.imageryLayers;
    layers.removeAll();

    const addOsm = () =>
      layers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
      );

    let base: any;
    if (mode === 'streets') {
      base = addOsm();
    } else if (mode === 'dark') {
      base = layers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/',
        }),
      );
    } else if (mode === 'terrain') {
      base = layers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.opentopomap.org/',
          maximumLevel: 16,
        }),
      );
    } else {
      // photorealistic / satellite
      if (this.hasToken) {
        try {
          base = layers.addImageryProvider(
            await Cesium.IonImageryProvider.fromAssetId(3),
          );
        } catch {
          base = addOsm();
        }
      } else {
        base = addOsm();
      }
    }

    // Dark mode dims the globe & atmosphere for a night-ops aesthetic.
    if (mode === 'dark' && base) {
      base.brightness = 0.9;
    }
  }

  // ---- Layers ---------------------------------------------------------------

  private ensureCollection(id: string): any {
    if (!this.collections[id]) {
      const c = new this.Cesium.CustomDataSource(id);
      this.viewer.dataSources.add(c);
      this.collections[id] = c;
    }
    return this.collections[id];
  }

  private buildLayers() {
    const Cesium = this.Cesium;

    // Municipalities
    const muni = this.ensureCollection('municipalities');
    for (const m of MUNICIPALITIES) {
      muni.entities.add({
        id: `muni-${m.id}`,
        position: Cesium.Cartesian3.fromDegrees(m.center[0], m.center[1]),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: m.name,
          font: '600 14px Inter, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#0f172a'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.1, 120000, 0.5),
        },
        properties: {
          kind: 'municipality',
          name: m.name,
          population: m.population,
          areaKm2: m.areaKm2,
          bbox: m.bbox,
        },
      });
    }

    // POIs, grouped into their layer collections.
    const groupToLayer: Record<string, string> = {
      airport: 'airports',
      port: 'ports',
      hospital: 'hospitals',
      university: 'universities',
      bridge: 'bridges',
      park: 'parks',
      landmark: 'landmarks',
      stadium: 'landmarks',
      'transit-hub': 'skytrain',
    };
    for (const poi of POINTS_OF_INTEREST) {
      const layerId = groupToLayer[poi.category] || 'landmarks';
      const col = this.ensureCollection(layerId);
      const color = POI_COLORS[poi.category] || '#ffd166';
      col.entities.add({
        id: `poi-${poi.id}`,
        position: Cesium.Cartesian3.fromDegrees(poi.position[0], poi.position[1]),
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.fromCssColorString('#0f172a'),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${POI_GLYPH[poi.category] || '•'} ${poi.name}`,
          font: '500 12px Inter, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#e2e8f0'),
          outlineColor: Cesium.Color.fromCssColorString('#0f172a'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
        },
        properties: {
          kind: 'poi',
          name: poi.name,
          category: poi.category,
          description: poi.description || '',
        },
      });
    }

    // SkyTrain lines & stations.
    const st = this.ensureCollection('skytrain');
    for (const line of SKYTRAIN_LINES) {
      const positions = line.stations.flatMap((s) => [s.position[0], s.position[1]]);
      st.entities.add({
        id: `line-${line.id}`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(positions),
          width: 5,
          material: Cesium.Color.fromCssColorString(line.color),
          clampToGround: true,
        },
        properties: { kind: 'transit-line', name: line.name },
      });
      for (const station of line.stations) {
        st.entities.add({
          position: Cesium.Cartesian3.fromDegrees(station.position[0], station.position[1]),
          point: {
            pixelSize: 6,
            color: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString(line.color),
            outlineWidth: 3,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          properties: {
            kind: 'station',
            name: station.name,
            line: line.name,
          },
        });
      }
    }
  }

  async setLayerVisible(id: string, on: boolean) {
    if (id === 'buildings') {
      await this.setBuildings(on);
      return;
    }
    if (id === 'terrain') {
      this.setTerrain(on);
      return;
    }
    const col = this.collections[id];
    if (col) col.show = on;
  }

  private async setBuildings(on: boolean) {
    const Cesium = this.Cesium;
    if (on) {
      if (!this.buildingTileset && this.hasToken) {
        try {
          this.buildingTileset = await Cesium.createOsmBuildingsAsync();
          this.viewer.scene.primitives.add(this.buildingTileset);
        } catch {
          /* buildings unavailable */
        }
      }
      if (this.buildingTileset) this.buildingTileset.show = true;
    } else if (this.buildingTileset) {
      this.buildingTileset.show = false;
    }
  }

  private setTerrain(on: boolean) {
    if (on && this.worldTerrain) this.viewer.terrainProvider = this.worldTerrain;
    else this.viewer.terrainProvider = this.flatTerrain;
  }

  // ---- Environment ----------------------------------------------------------

  setTimeOfDay(hour: number) {
    const Cesium = this.Cesium;
    // Interpret `hour` as local Pacific time; Vancouver is roughly UTC-7 (PDT).
    const utcHour = (hour + 7) % 24;
    const base = Cesium.JulianDate.fromIso8601('2024-06-21T00:00:00Z');
    const t = Cesium.JulianDate.addHours(base, utcHour, new Cesium.JulianDate());
    this.viewer.clock.currentTime = t;
    this.viewer.clock.shouldAnimate = false;
  }

  setLighting(on: boolean) {
    this.viewer.scene.globe.enableLighting = on;
  }

  setWeather(w: 'clear' | 'rain' | 'fog' | 'snow') {
    const scene = this.viewer.scene;
    // Approximate atmospheric conditions via fog density & imagery brightness.
    switch (w) {
      case 'fog':
        scene.fog.enabled = true;
        scene.fog.density = 0.0009;
        scene.skyAtmosphere.brightnessShift = -0.2;
        break;
      case 'rain':
        scene.fog.enabled = true;
        scene.fog.density = 0.0004;
        scene.skyAtmosphere.brightnessShift = -0.35;
        break;
      case 'snow':
        scene.fog.enabled = true;
        scene.fog.density = 0.0005;
        scene.skyAtmosphere.brightnessShift = 0.1;
        break;
      default:
        scene.fog.enabled = true;
        scene.fog.density = 0.0002;
        scene.skyAtmosphere.brightnessShift = 0;
    }
  }

  // ---- Simulation: sea-level rise / flood ----------------------------------

  setSeaLevelRise(meters: number) {
    const Cesium = this.Cesium;
    if (this.seaLevelEntity) {
      this.viewer.entities.remove(this.seaLevelEntity);
      this.seaLevelEntity = null;
    }
    if (meters <= 0) return;

    // A translucent water plane covering the region, extruded to the flood
    // height. Illustrative — a production model would clip against a DEM.
    this.seaLevelEntity = this.viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(-123.35, 48.95, -121.75, 49.42),
        material: Cesium.Color.fromCssColorString('#1e90ff').withAlpha(0.42),
        height: 0,
        extrudedHeight: meters,
        heightReference: Cesium.HeightReference.NONE,
      },
    });
  }

  // ---- Camera modes ---------------------------------------------------------

  setCameraMode(mode: CameraMode) {
    const Cesium = this.Cesium;
    const controller = this.viewer.scene.screenSpaceCameraController;

    // Clear any running orbit animation.
    if (this.orbitListener) {
      this.orbitListener();
      this.orbitListener = null;
    }

    controller.enableRotate = true;
    controller.enableTranslate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;

    if (mode === 'orbit') {
      // Slow automatic rotation around the current view center.
      const remove = this.viewer.clock.onTick.addEventListener(() => {
        this.viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.0009);
      });
      this.viewer.clock.shouldAnimate = true;
      this.orbitListener = remove;
    } else if (mode === 'drone') {
      // Gentle forward drift with a downward pitch.
      const remove = this.viewer.clock.onTick.addEventListener(() => {
        this.viewer.camera.moveForward(6);
      });
      this.viewer.clock.shouldAnimate = true;
      this.orbitListener = remove;
    } else if (mode === 'first-person') {
      controller.enableTranslate = false;
      // Drop to street level looking toward the horizon.
      const c = this.getCameraState();
      if (c) this.flyTo(c.lng, c.lat, 30, 0, -5);
    }
    // 'free-fly' leaves all controls enabled with no automation.
  }

  // ---- Picking & selection --------------------------------------------------

  private setupPicking() {
    const Cesium = this.Cesium;
    this.clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.clickHandler.setInputAction((movement: any) => {
      if (this.measureMode !== 'none') {
        this.handleMeasureClick(movement.position);
        return;
      }
      const picked = this.viewer.scene.pick(movement.position);
      if (Cesium.defined(picked)) {
        // Cesium3DTileFeature (a building)?
        if (picked instanceof Cesium.Cesium3DTileFeature) {
          this.emitBuildingSelection(picked, movement.position);
          return;
        }
        // An entity we created?
        const entity = picked.id;
        if (entity && entity.properties) {
          this.emitEntitySelection(entity);
          return;
        }
      }
      this.onSelect?.(null);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private emitEntitySelection(entity: any) {
    const props = entity.properties;
    const get = (k: string) => (props[k] ? props[k].getValue() : undefined);
    const kind = get('kind');
    const name = get('name') || 'Feature';
    const cart = entity.position?.getValue(this.viewer.clock.currentTime);
    const carto = cart ? this.Cesium.Cartographic.fromCartesian(cart) : null;
    const position: [number, number] = carto
      ? [this.Cesium.Math.toDegrees(carto.longitude), this.Cesium.Math.toDegrees(carto.latitude)]
      : [0, 0];

    const facts: { label: string; value: string }[] = [];
    if (kind === 'municipality') {
      facts.push({ label: 'Population (2021)', value: get('population').toLocaleString() });
      facts.push({ label: 'Land area', value: `${get('areaKm2')} km²` });
      const pop = get('population');
      const area = get('areaKm2');
      facts.push({ label: 'Density', value: `${Math.round(pop / area).toLocaleString()} /km²` });
    } else if (kind === 'poi') {
      facts.push({ label: 'Category', value: String(get('category')) });
      if (get('description')) facts.push({ label: 'About', value: String(get('description')) });
    } else if (kind === 'station') {
      facts.push({ label: 'Type', value: 'SkyTrain station' });
      facts.push({ label: 'Line', value: String(get('line')) });
    } else if (kind === 'transit-line') {
      facts.push({ label: 'Type', value: 'Rapid-transit line' });
    }
    facts.push({
      label: 'Coordinates',
      value: `${position[1].toFixed(4)}, ${position[0].toFixed(4)}`,
    });

    this.onSelect?.({ name, category: kind, position, facts });
  }

  private emitBuildingSelection(feature: any, screenPos: any) {
    const ids: string[] = feature.getPropertyIds ? feature.getPropertyIds() : [];
    const read = (k: string) => {
      try {
        return feature.getProperty(k);
      } catch {
        return undefined;
      }
    };
    const name = read('name') || read('addr:housename') || 'Building';
    const cart = this.viewer.scene.pickPosition(screenPos);
    const carto = cart ? this.Cesium.Cartographic.fromCartesian(cart) : null;
    const position: [number, number] = carto
      ? [this.Cesium.Math.toDegrees(carto.longitude), this.Cesium.Math.toDegrees(carto.latitude)]
      : [0, 0];

    // Height / floors: use OSM property if present, otherwise estimate.
    const rawHeight = read('height') || read('cesium#estimatedHeight');
    const height = rawHeight ? Math.round(Number(rawHeight)) : null;
    const floors = height ? Math.max(1, Math.round(height / 3.2)) : null;

    const facts: { label: string; value: string }[] = [];
    const addr = [read('addr:housenumber'), read('addr:street')].filter(Boolean).join(' ');
    if (addr) facts.push({ label: 'Address', value: addr });
    if (height) facts.push({ label: 'Height', value: `${height} m` });
    if (floors) facts.push({ label: 'Est. floors', value: String(floors) });
    for (const key of ['building', 'amenity', 'shop', 'office']) {
      if (ids.includes(key) && read(key)) {
        facts.push({ label: key, value: String(read(key)) });
      }
    }
    facts.push({
      label: 'Coordinates',
      value: `${position[1].toFixed(5)}, ${position[0].toFixed(5)}`,
    });
    facts.push({
      label: 'Note',
      value: 'Analytics (value, zoning, energy) are illustrative pending open-data hookup.',
    });

    this.onSelect?.({ name: String(name), category: 'building', position, facts });
  }

  // ---- Measurement ----------------------------------------------------------

  setMeasureMode(mode: 'none' | 'distance' | 'area') {
    this.measureMode = mode;
    this.clearMeasurements();
  }

  private clearMeasurements() {
    for (const e of this.measureEntities) this.viewer.entities.remove(e);
    this.measureEntities = [];
    this.measurePoints = [];
  }

  private handleMeasureClick(screenPos: any) {
    const Cesium = this.Cesium;
    const cart = this.viewer.scene.pickPosition(screenPos) ||
      this.viewer.camera.pickEllipsoid(screenPos);
    if (!cart) return;
    this.measurePoints.push(cart);

    const dot = this.viewer.entities.add({
      position: cart,
      point: { pixelSize: 8, color: Cesium.Color.YELLOW, disableDepthTestDistance: Infinity },
    });
    this.measureEntities.push(dot);

    if (this.measureMode === 'distance' && this.measurePoints.length >= 2) {
      const pts = this.measurePoints;
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        total += Cesium.Cartesian3.distance(pts[i - 1], pts[i]);
      }
      const line = this.viewer.entities.add({
        polyline: {
          positions: pts,
          width: 3,
          material: Cesium.Color.YELLOW,
          clampToGround: true,
        },
        label: {
          text: `${(total / 1000).toFixed(2)} km`,
          font: '600 14px Inter, sans-serif',
          fillColor: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.8),
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Infinity,
        },
        position: pts[pts.length - 1],
      });
      this.measureEntities = this.measureEntities.filter((e) => e !== line);
      this.measureEntities.push(line);
    }

    if (this.measureMode === 'area' && this.measurePoints.length >= 3) {
      const area = this.computePolygonArea(this.measurePoints);
      const poly = this.viewer.entities.add({
        polygon: {
          hierarchy: this.measurePoints,
          material: Cesium.Color.YELLOW.withAlpha(0.25),
          outline: true,
          outlineColor: Cesium.Color.YELLOW,
        },
        position: this.measurePoints[0],
        label: {
          text: `${(area / 1e6).toFixed(3)} km²`,
          font: '600 14px Inter, sans-serif',
          fillColor: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.8),
          disableDepthTestDistance: Infinity,
        },
      });
      this.measureEntities.push(poly);
    }
  }

  private computePolygonArea(points: any[]): number {
    // Spherical excess approximation on lon/lat.
    const Cesium = this.Cesium;
    const carto = points.map((p) => Cesium.Cartographic.fromCartesian(p));
    const R = 6378137;
    let total = 0;
    for (let i = 0; i < carto.length; i++) {
      const p1 = carto[i];
      const p2 = carto[(i + 1) % carto.length];
      total += (p2.longitude - p1.longitude) * (2 + Math.sin(p1.latitude) + Math.sin(p2.latitude));
    }
    return Math.abs((total * R * R) / 2);
  }

  // ---- Camera helpers -------------------------------------------------------

  flyTo(lng: number, lat: number, height: number, headingDeg = 0, pitchDeg = -35) {
    const Cesium = this.Cesium;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0,
      },
      duration: 2.2,
    });
  }

  flyToBbox(bbox: [number, number, number, number]) {
    const Cesium = this.Cesium;
    this.viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(bbox[0], bbox[1], bbox[2], bbox[3]),
      duration: 2,
    });
  }

  focusPoi(poi: Poi) {
    this.flyTo(poi.position[0], poi.position[1], 1800, 0, -45);
  }

  resetNorth() {
    const Cesium = this.Cesium;
    this.viewer.camera.flyTo({
      destination: this.viewer.camera.positionWC.clone(),
      orientation: { heading: 0, pitch: this.viewer.camera.pitch, roll: 0 },
      duration: 0.8,
    });
  }

  getCameraState(): { lng: number; lat: number; height: number } | null {
    if (!this.viewer) return null;
    const Cesium = this.Cesium;
    const carto = this.viewer.camera.positionCartographic;
    return {
      lng: Cesium.Math.toDegrees(carto.longitude),
      lat: Cesium.Math.toDegrees(carto.latitude),
      height: carto.height,
    };
  }

  getHeadingDeg(): number {
    if (!this.viewer) return 0;
    return this.Cesium.Math.toDegrees(this.viewer.camera.heading);
  }

  onCameraChange(cb: () => void): () => void {
    const remove = this.viewer.camera.changed.addEventListener(cb);
    this.viewer.camera.percentageChanged = 0.01;
    return remove;
  }

  screenshot() {
    this.viewer.render();
    const canvas = this.viewer.scene.canvas as HTMLCanvasElement;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `metro-vancouver-twin-${Date.now()}.png`;
    a.click();
  }

  destroy() {
    if (this.orbitListener) this.orbitListener();
    if (this.clickHandler) this.clickHandler.destroy();
    if (this.viewer && !this.viewer.isDestroyed()) this.viewer.destroy();
    this.viewer = null;
  }
}
