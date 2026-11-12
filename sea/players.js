// A small game on a field: two toy teams with no faces, so nobody is mistaken for a real person.
// Team 0 is the Lions, in red. Team 1 mirrors its starting spots.
import * as THREE from 'three';

export function addPlayers(group, {field, ground, squad, kits, ball: ballStyle, shot, dribbleBounce = 0}) {
  const SIDE = {x: field.width / 2 - .32, z: field.depth / 2 - .3};
  const part = (geometry, material, parent, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const standard = color => new THREE.MeshStandardMaterial({color, roughness: .6});
  const torso = new THREE.CapsuleGeometry(.06, .1, 4, 12), hips = new THREE.CylinderGeometry(.062, .066, .06, 12);
  const limb = new THREE.CapsuleGeometry(.021, .1, 3, 8), head = new THREE.SphereGeometry(.058, 14, 10);
  limb.translate(0, -.06, 0);
  const skin = standard('#f0cdaa'), hair = standard('#2c2320'), socks = standard('#fbfaf3');

  const players = kits.flatMap((kit, team) => squad.map(([x, z, keeper = false]) => {
    const shirt = standard(keeper ? kit.keeper : kit.shirt);
    const body = new THREE.Group();
    body.position.set(field.x + (team ? -x : x), ground, field.z + z);
    body.scale.setScalar(1.6);
    group.add(body);
    part(hips, standard(kit.shorts), body, 0, .165, 0);
    part(torso, shirt, body, 0, .265, 0);
    part(head, skin, body, 0, .4, 0);
    part(head, hair, body, 0, .412, -.012).scale.set(1.03, .92, 1.03);
    const legs = [-1, 1].map(s => part(limb, socks, body, s * .032, .15, 0));
    const arms = [-1, 1].map(s => part(limb, shirt, body, s * .08, .31, 0));
    return {body, team, keeper, legs, arms, home: body.position.clone(), goal: body.position.clone(), step: Math.random() * 6, seed: Math.random() * 6};
  }));

  const restY = ground + ballStyle.radius;
  const ball = part(new THREE.SphereGeometry(ballStyle.radius, 18, 12), standard(ballStyle.color), group, field.x, restY, field.z);

  let owner = players[Math.floor(players.length * .75)], flight = null, wait = 1.2, time = 0;
  const attacking = player => (player.team ? -1 : 1);
  const clampX = x => Math.max(field.x - SIDE.x, Math.min(field.x + SIDE.x, x));
  const clampZ = z => Math.max(field.z - SIDE.z, Math.min(field.z + SIDE.z, z));
  const distanceTo = (player, x, z) => Math.hypot(player.body.position.x - x, player.body.position.z - z);
  const nearest = (list, x, z) => [...list].sort((a, b) => distanceTo(a, x, z) - distanceTo(b, x, z))[0];

  function kick({x, z, y = restY, receiver = null, height, speed, then = null}) {
    const distance = Math.hypot(x - ball.position.x, z - ball.position.z);
    flight = {fromX: ball.position.x, fromY: ball.position.y, fromZ: ball.position.z, x, y, z, receiver, height, then, t: 0, length: Math.max(.3, distance / speed)};
    owner = null;
  }

  function nextMove() {
    const direction = attacking(owner);
    const ahead = (ball.position.x - field.x) * direction;
    if (!owner.keeper && ahead > shot.from && Math.random() < shot.chance) {
      shot.take(owner, direction, {players, kick, nearest, ball, restY});
      return;
    }
    // Usually forward to a teammate; sometimes the other team reads the pass.
    const teammates = players.filter(p => p.team === owner.team && p !== owner && !p.keeper);
    const ranked = teammates.map(p => ({p, score: (p.body.position.x - ball.position.x) * direction - distanceTo(p, ball.position.x, ball.position.z) * .55 + Math.random() * 1.1})).sort((a, b) => b.score - a.score);
    let receiver = ranked[0].p;
    const x = clampX(receiver.body.position.x + direction * .3), z = clampZ(receiver.body.position.z + (Math.random() - .5) * .3);
    if (Math.random() < .16) receiver = nearest(players.filter(p => p.team !== owner.team && !p.keeper), x, z);
    kick({x, z, receiver, height: .05 + dribbleBounce * .4, speed: 2.1});
  }

  return dt => {
    time += dt;
    if (flight) {
      flight.t = Math.min(1, flight.t + dt / flight.length);
      ball.position.x = flight.fromX + (flight.x - flight.fromX) * flight.t;
      ball.position.z = flight.fromZ + (flight.z - flight.fromZ) * flight.t;
      ball.position.y = flight.fromY + (flight.y - flight.fromY) * flight.t + Math.sin(flight.t * Math.PI) * flight.height;
      ball.rotation.x += dt * 9;
      if (flight.t === 1) {
        const {receiver, then} = flight;
        flight = null;
        if (then) then();
        else {
          owner = receiver;
          wait = owner.keeper ? 1.4 : .7 + Math.random();
        }
      }
    } else if (owner) {
      // Dribble: the ball stays at the feet of whoever has it.
      const facing = owner.body.rotation.y;
      ball.position.set(owner.body.position.x + Math.sin(facing) * .17, restY + Math.abs(Math.sin(time * 8)) * dribbleBounce, owner.body.position.z + Math.cos(facing) * .17);
      wait -= dt;
      if (wait <= 0) nextMove();
    }

    const focusX = flight ? flight.x : ball.position.x, focusZ = flight ? flight.z : ball.position.z;
    for (const player of players) {
      const {body, goal, home} = player;
      if (player.keeper) {
        // Stays on the line, following the ball across.
        if (!(flight && flight.receiver === player)) goal.z = field.z + Math.max(-.42, Math.min(.42, (focusZ - field.z) * .35));
        goal.x = home.x;
      } else if (player === owner) {
        goal.x = clampX(body.position.x + attacking(player) * .5);
        goal.z = clampZ(body.position.z + Math.sin(time * .7 + player.seed) * .3);
      } else if (flight?.receiver === player) {
        goal.set(flight.x, ground, flight.z);
      } else {
        // Hold a shape that slides up and down the field with the ball, with a little wander.
        goal.x = clampX(home.x + (focusX - field.x) * .55 + Math.sin(time * .5 + player.seed) * .14);
        goal.z = clampZ(home.z + (focusZ - field.z) * .2 + Math.cos(time * .43 + player.seed) * .14);
      }
      const dx = goal.x - body.position.x, dz = goal.z - body.position.z, away = Math.hypot(dx, dz);
      const pace = Math.min(player === owner ? .46 : .78, away * 2.2);
      if (away > .01) {
        body.position.x += dx / away * pace * dt;
        body.position.z += dz / away * pace * dt;
      }
      const look = away > .05 ? Math.atan2(dx, dz) : Math.atan2(focusX - body.position.x, focusZ - body.position.z);
      const turn = Math.atan2(Math.sin(look - body.rotation.y), Math.cos(look - body.rotation.y));
      body.rotation.y += turn * Math.min(1, dt * 8);
      // Legs and arms swing with speed.
      player.step += dt * pace * 16;
      const swing = Math.sin(player.step) * Math.min(.85, pace * 1.4);
      player.legs[0].rotation.x = swing;
      player.legs[1].rotation.x = -swing;
      player.arms[0].rotation.x = -swing * .7;
      player.arms[1].rotation.x = swing * .7;
    }
  };
}
