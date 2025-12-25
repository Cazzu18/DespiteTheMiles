import { Environment, Float, OrbitControls, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Book } from "./Book";

const SNOW_AREA = [20, 15, 15];
const SNOW_CENTER = [0, 1, -7];

const Snow = ({
    count = 2000,
    area = SNOW_AREA,
    center = SNOW_CENTER,
    size = 0.06,
    opacity = 0.75,
    speed = 0.5,
    drift = 0.25,
}) => {
    const pointsRef = useRef(null);
    const texture = useTexture("/textures/snowflake.png");
    const [width, height, depth] = area;
    const [cx, cy, cz] = center;

    const { positions, velocities } = useMemo(() => {
        const positionsArray = new Float32Array(count * 3);
        const velocitiesArray = new Float32Array(count * 3);

        for (let i = 0; i < count; i += 1) {
            const i3 = i * 3;
            positionsArray[i3] = cx + (Math.random() - 0.5) * width;
            positionsArray[i3 + 1] = cy + (Math.random() - 0.5) * height;
            positionsArray[i3 + 2] = cz + (Math.random() - 0.5) * depth;

            velocitiesArray[i3] = (Math.random() - 0.5) * drift;
            velocitiesArray[i3 + 1] = speed * (0.4 + Math.random() * 0.6);
            velocitiesArray[i3 + 2] = (Math.random() - 0.5) * drift;
        }

        return { positions: positionsArray, velocities: velocitiesArray };
    }, [count, cx, cy, cz, width, height, depth, speed, drift]);

    useFrame((_, delta) => {
        const points = pointsRef.current;
        if (!points) return;

        const positionAttr = points.geometry.getAttribute("position");
        const pos = positionAttr.array;
        const xMin = cx - width / 2;
        const xMax = cx + width / 2;
        const yMin = cy - height / 2;
        const yMax = cy + height / 2;
        const zMin = cz - depth / 2;
        const zMax = cz + depth / 2;

        for (let i = 0; i < count; i += 1) {
            const i3 = i * 3;
            pos[i3] += velocities[i3] * delta;
            pos[i3 + 1] -= velocities[i3 + 1] * delta;
            pos[i3 + 2] += velocities[i3 + 2] * delta;

            if (pos[i3 + 1] < yMin) {
                pos[i3 + 1] = yMax;
                pos[i3] = cx + (Math.random() - 0.5) * width;
                pos[i3 + 2] = cz + (Math.random() - 0.5) * depth;
            }

            if (pos[i3] < xMin) {
                pos[i3] = xMax;
            } else if (pos[i3] > xMax) {
                pos[i3] = xMin;
            }

            if (pos[i3 + 2] < zMin) {
                pos[i3 + 2] = zMax;
            } else if (pos[i3 + 2] > zMax) {
                pos[i3 + 2] = zMin;
            }
        }

        positionAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={positions}
                    count={positions.length / 3}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#ffffff"
                size={size}
                transparent
                opacity={opacity}
                sizeAttenuation
                depthWrite={false}
                alphaMap={texture}
                alphaTest={0.01}
            />
        </points>
    );
};

export const Experience = () => {
    return(
        <>
            <Snow />
            <Float
            //floating effect
                rotation-x={-Math.PI / 4}
                floatIntesity={1}
                speed={1.7}
                rotationIntensity={2}
            >
                <Book />
            </Float>
            <OrbitControls />
            <Environment preset="studio"></Environment>
            <directionalLight 
                position={[2, 5, 2]}
                intensity={2.2}//2.5
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-bias={-0.0001}
            />
            <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial transparent opacity={0.2} />
            </mesh>
        
        </>
    );
};
