import { useMemo, useRef, useEffect, useState} from "react";
import {pages, pageAtom} from "./UI";
import{ MathUtils, BoxGeometry, MeshStandardMaterial, SkinnedMesh, Uint16BufferAttribute, Vector3, Float32BufferAttribute, Bone, Skeleton, Color, SkeletonHelper, SRGBColorSpace} from "three";
import {useHelper, useTexture} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { degToRad } from "three/src/math/MathUtils.js";
import { useAtom } from "jotai";
import { easing } from "maath";

//const lerpFactor = 0.05;//controls the speed of interpolation(linear)
const easingFactor = 0.5;//controls the speed of easing
const easingFactorFold = 0.3;//controls the speed of easing
const insideCurveStrength = 0.17; //controls the strength of the curve
const outsideCurveStrenth = 0.05;//controls strength of curve
const turningCurveStrength = 0.09; //controls strength of curve

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71; //4:3 aspect ratio
const PAGE_DEPTH  = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry( PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, 2);


pageGeometry.translate(PAGE_WIDTH/ 2, 0, 0)//x , y, z we are moving the geometry to start at the left rather than the center because x reduces by half

const position = pageGeometry.attributes.position; //all the positions
const vertex = new Vector3();
const skinIndexes = [];//indexes of bones
const skinWeights = [];

for(let i = 0; i < position.count; i++){
    //ALL VERTICES
    vertex.fromBufferAttribute(position, i); //gettingt the vertex
    const x = vertex.x; //getting the x position of the vertex

    //to know which bones will be affected we use the floor value between x and the segment width. 
    //So if we are close to 0(part that holds book together) we move bones closest to that.
    //If we are close to the right edge of a page, we move bones near there
    const skinIndex = Math.max(0, Math.floor(x/SEGMENT_WIDTH));
    let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;//intensity at which bones impacts vertice(0, 1). 1 impacted completely and 0 not at all

    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);//(first bones that has impact, second bone that has impact, etc)
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0)//impact of the bone

}

pageGeometry.setAttribute(
    "skinIndex",
    new Uint16BufferAttribute(skinIndexes, 4)
)

pageGeometry.setAttribute(
    "skinWeight",
    new Float32BufferAttribute(skinWeights, 4)//float because value between 0 and 1
)


const whiteColor = new Color("white");
//1 material per face(total of 6 face because box has 6 faces)
const pageMaterials = [
    new MeshStandardMaterial({
        color: whiteColor,
    }),

    //can be seen on the "thicknes"
    new MeshStandardMaterial({
        color: "#111",
    }),
    new MeshStandardMaterial({
        color: whiteColor,
    }),
    new MeshStandardMaterial({
        color: whiteColor,
    }),
];

pages.forEach((page) => {
    useTexture.preload(`/textures/${page.front}.jpg`);
    useTexture.preload(`/textures/${page.back}.jpg`);
    useTexture.preload(`/textures/book-cover-roughness.jpg`);
});

//lower the scale on the mesh the smaller the object
const Page = ({number, front, back, page, opened, bookClosed, ...props}) => {

    const [picture, picture2, pcitureRoughness] = useTexture([
        `/textures/${front}.jpg`,
        `/textures/${back}.jpg`,
        ...(number === 0 || number === pages.length - 1

            ? [`/textures/book-cover-roughness.jpg`]
            : []
        ),
    ]);
    picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
    const group = useRef();
    const turnedAt =useRef(0);
    const lastOpened = useRef(opened);//check wether opened or not at last frame

    const skinnedMeshRef = useRef();

    //useMemo caches the result of a function calculation between rerenders
    const manualSkinnedMesh = useMemo(() => {
        const bones =[];

        for(let i = 0; i <= PAGE_SEGMENTS; i++){
            let bone = new Bone();
            bones.push(bone);

            if(i === 0){
                bone.position.x = 0;
            } else {
                bone.position.x = SEGMENT_WIDTH;
            }

            //not the first bone
            if(i > 0){
                bones[i - 1].add(bone); //attach the new bone to the previous bone
            }
        }
        const skeleton = new Skeleton(bones);

        const materials = [...pageMaterials,
            new MeshStandardMaterial({
                color: whiteColor,
                map: picture,
                ...(number === 0
                    ? {
                        roughnessMap: pcitureRoughness,
                    }

                    : {
                        roughness: 0.1,//value near one for matte effect
                    }),
            }),

            new MeshStandardMaterial({
                color: whiteColor,
                map: picture2,
                ...(number === pages.length - 1 //last page
                    ? {
                        roughnessMap: pcitureRoughness,
                    }

                    : {
                        roughness: 0.1,//value near one for matte effect
                    }),
            }),
        ];
        const mesh = new SkinnedMesh(pageGeometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; //stop Three.js from automatically skipping rendering the mesh when it thinks its outside the camera view
        mesh.add(skeleton.bones[0]);//root bone
        mesh.bind(skeleton);

        return mesh;
    }, []);


    //useHelper(skinnedMeshRef, SkeletonHelper, "red");

    useFrame((_, delta) => {
        if(!skinnedMeshRef.current){
            return;
        }

        //if values of opened and lastOpened are different, then we just changed the value
        if(lastOpened.current !== opened){
            turnedAt.current = +new Date(); //+ for timestamp value
            lastOpened.current = opened;
        }

        let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;//value between 0 and 1
        turningTime = Math.sin(turningTime * Math.PI); //smoothing

        let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
        if(!bookClosed){
            targetRotation += degToRad(number * 0.8);
        }
        
        const bones = skinnedMeshRef.current.skeleton.bones;

        for(let i = 0; i < bones.length; i++){
            const target = i === 0 ? group.current : bones[i];
            
            const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
            const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.009) : 0;
            const turningIntensity = Math.sin(i * Math.PI * (1/ bones.length)) * turningTime;

            let rotationAngle = (insideCurveStrength * insideCurveIntensity * targetRotation) -
            ( outsideCurveStrenth * outsideCurveIntensity * targetRotation) +
            (turningCurveStrength * turningIntensity * targetRotation);

            let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);// either 1 or -1 * 2

            if(bookClosed){
                if(i===0){
                    rotationAngle = targetRotation;
                    foldRotationAngle = 0;
                } else {
                    rotationAngle = 0;
                }
            }
            easing.dampAngle(target.rotation, "y", rotationAngle, easingFactor, delta);

            const foldIntensity = i > 8 ? Math.sin(i * Math.PI * (1/bones.length) - 0.5) * turningTime : 0;
            easing.dampAngle(
                target.rotation,
                "x",
                foldRotationAngle * foldIntensity,
                easingFactorFold,
                delta
            )
        }
    })

    return (
        <group {...props} ref={group}>
            <primitive object={manualSkinnedMesh} ref={skinnedMeshRef} position-z ={-number * PAGE_DEPTH + page * PAGE_DEPTH}
            />
        </group>
    )
}

///props to position from the parent
export const Book = ({...props}) => {
    const [page] = useAtom(pageAtom);
    const [delayedPage, setDelayedPage] = useState(page);

    useEffect(() => {
        let timeout;
        const goToPage = () => {
            setDelayedPage((delayedPage) => {
                if (page === delayedPage){
                    return delayedPage;
                } else {
                    timeout = setTimeout(
                        () => {
                            goToPage();
                        },
                        Math.abs(page - delayedPage) > 2 ? 50 :  150
                    );

                    if(page > delayedPage){
                        return delayedPage + 1;
                    }

                    if(page < delayedPage){
                        return delayedPage - 1;
                    }
                }
            });
        };
        goToPage();
        return () => {
            clearTimeout(timeout);

        };
    }, [page]); //only take effect if the values in the list change
    return(
        
        <group {...props} rotation-y={-Math.PI / 2}>
            {[...pages].map((pageData, index) => (
                //only render the first page
                <Page 
                    //so that page position is different and we can see the spaces
                    key={index}
                    page = {delayedPage}
                    number ={index} 
                    opened={delayedPage > index}
                    bookClosed={delayedPage === 0 || delayedPage === pages.length}
                    {...pageData} 
                />
            ))}
        </group>
    )

}