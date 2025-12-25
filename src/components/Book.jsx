import { useMemo, useRef, useEffect, useState} from "react";
import {pages, pageAtom} from "./UI";
import{ BoxGeometry, MeshStandardMaterial, SkinnedMesh, Uint16BufferAttribute, Vector3, Float32BufferAttribute, Bone, Skeleton, Color, SkeletonHelper, SRGBColorSpace} from "three";
import {useHelper, useTexture} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { degToRad } from "three/src/math/MathUtils.js";
import { useAtom } from "jotai";

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
const Page = ({number, front, back, page, ...props}) => {

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

    useFrame(() => {
        if(!skinnedMeshRef.current){
            return;
        }

        const bones = skinnedMeshRef.current.skeleton.bones;
    })

    return (
        <group {...props} ref={group}>
            <primitive object={manualSkinnedMesh} ref={skinnedMeshRef} 
                position-z ={-number * PAGE_DEPTH + page * PAGE_DEPTH}
            />
        </group>
    )
}

///props to position from the parent
export const Book = ({...props}) => {
    const [page] = useAtom(pageAtom);
    return(
        
        <group {...props}>
            {[...pages].map((pageData, index) => (
                //only render the first page
                <Page 
                    //so that page position is different and we can see the spaces
                    key={index}
                    page = {page}
                    number ={index} 
                    {...pageData} 
                />
            ))}
        </group>
    )

}