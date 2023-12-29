import ThreeJSOverlayView from "@ubilabs/threejs-overlay-view";
import { CatmullRomCurve3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { Loader } from "@googlemaps/js-api-loader";
const apiOptions = {
  apiKey: "AIzaSyA9f2nTclRIV0nu7YmRQbxrYW-bZHenTDM",
  version: "beta",
};

const VIEW_PARAMS = {
  center: { lat: 59.3293, lng: 18.0686 },
  zoom: 18,
  tilt: 65,
};

const drones = [];
const mapContainer = document.querySelector("#map");

async function main() {
  const map = await initMap();

  const overlay = new ThreeJSOverlayView(VIEW_PARAMS.center);
  const scene = overlay.getScene();

  overlay.setMap(map);

  // create a Catmull-Rom spline from the points to smooth out the corners
  // for the animation
  // const points = ANIMATION_POINTS.map((p) => overlay.latLngAltToVector3(p));
  // const curve = new CatmullRomCurve3(points, true, "catmullrom", 0.2);
  // curve.updateArcLengths();

  // const trackLine = createTrackLine(curve);
  // scene.add(trackLine);

  createDrones().then((res) => {
    res.forEach((drone) => {
      drones.push(drone);
      scene.add(drone.model);
    });

    overlay.requestRedraw();
  });

  // the update-function will animate the car along the spline
  overlay.update = () => {
    // trackLine.material.resolution.copy(overlay.getViewportSize());

    // const animationProgress =
    //   (performance.now() % ANIMATION_DURATION) / ANIMATION_DURATION;

    // curve.getPointAt(animationProgress, carModel.position);
    // curve.getTangentAt(animationProgress, tmpVec3);
    let newPos = undefined;
    for (let drone of drones) {
      drone.position.lat += drone.velocity.lat;
      drone.position.lng += drone.velocity.lng;
      drone.position.altitude += drone.velocity.altitude;

      newPos = overlay.latLngAltToVector3(drone.position);

      drone.model.position.copy(newPos);
    }
    overlay.requestRedraw();
  };
}

/**
 * Load the Google Maps API and create the fullscreen map.
 */

async function initMap() {
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();
  return new google.maps.Map(mapContainer, {
    mapId: "40b09aa69bb0eff3",
    disableDefaultUI: true,
    backgroundColor: "transparent",
    gestureHandling: "greedy",
    ...VIEW_PARAMS,
  });
}

/**
 * Create a mesh-line from the spline to render the track the car is driving.
 */
// function createTrackLine(curve) {
//   const numPoints = 10 * curve.points.length;
//   const curvePoints = curve.getSpacedPoints(numPoints);
//   const positions = new Float32Array(numPoints * 3);

//   for (let i = 0; i < numPoints; i++) {
//     curvePoints[i].toArray(positions, 3 * i);
//   }

//   const trackLine = new Line2(
//     new LineGeometry(),
//     new LineMaterial({
//       color: 0x0f9d58,
//       linewidth: 5,
//     })
//   );

//   trackLine.geometry.setPositions(positions);

//   return trackLine;
// }

/**
 * Load and prepare the car-model for animation.
 */
async function createDrones() {
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    let res = [];
    let source = "drone/drone.gltf";
    loader.load(source, (gltf) => {
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.rotation.x = (90 * Math.PI) / 180;
      //add 10 drones
      for (let i = 0; i < 10; i++) {
        //random pos close to the center
        let position = {
          lat: VIEW_PARAMS.center.lat + Math.random() * 0.001,
          lng: VIEW_PARAMS.center.lng + Math.random() * 0.001,
          altitude: 100 + Math.random() * 100,
        };

        let velocity = {
          lat: Math.random() * 0.00001,
          lng: Math.random() * 0.00001,
          altitude: Math.random() * 0.00001,
        };

        res.push({
          model: gltf.scene.clone(),
          position,
          velocity,
        });
      }

      resolve(res);
    });
  });
}

main().catch((err) => console.error(err));
