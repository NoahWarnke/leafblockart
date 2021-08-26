import React, { useEffect, useMemo, useRef } from 'react';
import { useThree, Canvas } from 'react-three-fiber';
import MersenneTwist from 'mersenne-twister';
import { TorusKnot } from '@react-three/drei';
import Color from 'color';
import { context } from '@react-three/fiber';

/*
Create your Custom style to be turned into a EthBlock.art BlockStyle NFT

Basic rules:
 - use a minimum of 1 and a maximum of 4 "modifiers", modifiers are values between 0 and 1,
 - use a minimum of 1 and a maximum of 3 colors, the color "background" will be set at the canvas root
 - Use the block as source of entropy, no Math.random() allowed!
 - You can use a "shuffle bag" using data from the block as seed, a MersenneTwister library is provided

 Arguments:
  - block: the blockData, in this example template you are given 3 different blocks to experiment with variations, check App.js to learn more
  - mod[1-3]: template modifier arguments with arbitrary defaults to get your started
  - color: template color argument with arbitrary default to get you started

Getting started:
 - Write canvas code, consuming the block data and modifier arguments,
   make it cool and use no random() internally, component must be pure, output deterministic
 - Customize the list of arguments as you wish, given the rules listed below
 - Provide a set of initial /default values for the implemented arguments, your preset.
 - Think about easter eggs / rare attributes, display something different every 100 blocks? display something unique with 1% chance?


*/

// Required style metadata
const styleMetadata = {
  name: '',
  description: '',
  image: '',
  creator_name: '',
  options: {
    mod1: 0.4,
    mod2: 0.1,
    mod3: 0.4,
    color1: '#fff000',
    background: '#000000',
  },
};

export { styleMetadata };

/*
function rect(props) {
  const { ctx, x, y, width, height, color } = props;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  //ctx.strokeRect(x, y, width, height);

  ctx.beginPath();
  ctx.moveTo(75 + x, 25 + y);
  ctx.quadraticCurveTo(25 + x, 25 + y, 25 + x, 62.5 + y);
  ctx.quadraticCurveTo(25 + x, 100 + y, 50 + x, 100 + y);
  ctx.quadraticCurveTo(50 + x, 120 + y, 30 + x, 125 + y);
  ctx.quadraticCurveTo(60 + x, 120 + y, 65 + x, 100 + y);
  ctx.quadraticCurveTo(125 + x, 100 + y, 125 + x, 62.5 + y);
  ctx.quadraticCurveTo(125 + x, 25 + y, 75 + x, 25 + y);
  ctx.stroke();
}
*/

const Outer = React.memo(({ canvasRef, block, width, height, mod1, mod2, mod3, color1, background, ...props }) => {
    const shuffleBag = useRef();
    const hoistedValue = useRef();

    if (!shuffleBag || !hoistedValue) {
      return;
    }

    useEffect(() => {
      // Setup
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const { hash } = block;
      const seed = parseInt(hash.slice(0, 16), 16);
      shuffleBag.current = new MersenneTwist(seed);

      function rnd() {
        return shuffleBag.current.random();
      }

      let width = canvas.width;
      let height = canvas.height;

      ctx.fillStyle = Color([0, 0, 0]);
      ctx.fillRect(0, 0, width, height);

      let numTrees = Math.floor(rnd() * 20) + 1;
      let minBranches = 5;
      let maxBranches = 12;

      let treesRemainingBranches = [];

      for (var i = 0; i < numTrees; i++) {
        let startX = rnd() * 1;
        let startY = rnd() * 1;
  
        
        let numBranches = Math.floor(rnd() * (maxBranches - minBranches)) + minBranches;
        
        let lineLength = rnd() * 0.1 + 0.05;
        let lineLengthMin = lineLength / 10;
        
        treesRemainingBranches.push(
          statefulTree(startX, startY, numBranches, lineLength, lineLengthMin)
        );
      }

      
      let anythingLeftToDo = treesRemainingBranches.reduce((accumulator, cur) => {
        return accumulator || cur.length > 0;
      }, false);

      let depth = 0;
      
      while (anythingLeftToDo) {
        if (depth++ > 10) {
          return;
        };

        for (let i = 0; i < numTrees; i++) {
          treesRemainingBranches[i] = renderDeeperLevel(treesRemainingBranches[i]);
        }

        anythingLeftToDo = treesRemainingBranches.reduce((accumulator, cur) => {
          return accumulator || cur.length > 0;
        }, false);
      }

      function statefulTree(startX, startY, numBranches, lineLength, lineLengthMin) {
        

        // Generate angles for start of branching
        let angles = [];
        for (let i = 0; i < numBranches; i++) {
          let tooClose = true;

          let c = 0;

          while (tooClose) {
            tooClose = false;
            angles[i] = Math.PI * 2 * rnd();

            // Check all previous branches to see if new one is too close.
            for (let j = 0; j < i; j++) {
              let thisOneIsTooClose = Math.abs(angles[i] - angles[j]) < Math.PI / numBranches;
              tooClose = tooClose || thisOneIsTooClose;
            }
          }
        }

        let remainingBranches = [];

        // Actual looping
        for (let i = 0; i < numBranches; i++) {
          remainingBranches.push(
            {
              coreX: 0, coreY: 0, 
              x: startX, y: startY,
              angle: angles[i],
              lineLength,
              lineLengthMin,
              lineWidth: lineLength / 10 
            },
          );
        }

        return remainingBranches;
      }


      function renderDeeperLevel(remainingBranches) {
        let newRemainingBranches = [];

        remainingBranches.forEach(branchState => {
          let childBranches = statefulBranch(branchState);
          newRemainingBranches.push(...childBranches);
        });

        return newRemainingBranches;
      }


      function statefulBranch(branchState) {
        let {coreX, coreY, x, y, angle, lineLength, lineLengthMin, lineWidth} = branchState;
        
        //console.log('statefulBranch: ');
        //console.log(x + ', ' + y + ', ' + lineLength);

        // If lineLength too small, finish
        if (lineLength < lineLengthMin) {
          return [];
        }

        ctx.strokeStyle = Color([0, 255, 0]).hex();
        ctx.lineWidth = lineWidth * width;
        ctx.beginPath();
        ctx.moveTo(x * width, y * height);

        let endX = x + Math.cos(angle) * lineLength;
        let endY = y + Math.sin(angle) * lineLength;

        ctx.lineTo(
          endX * width, 
          endY * height
        );
        ctx.stroke();


        //let branchingAngle = Math.PI / 8;
        let branchingAngle = mod1;
        
        return [
          {
            coreX, coreY, 
            x: endX, y: endY,
            angle: angle - branchingAngle,
            lineLength: lineLength / 1.5,
            lineLengthMin,
            lineWidth: lineWidth / 1.5 
          },
          {
            coreX, coreY, 
            x: endX, y: endY,
            angle: angle + branchingAngle,
            lineLength: lineLength / 1.5,
            lineLengthMin,
            lineWidth: lineWidth / 1.5 
          },
        ];
      }

      /*
      
        // Create a single fractal
      function radialTree(startX, startY, numBranches, branchLengthStart, branchLengthMin) {
        
        // Generate angles for start of branching
        let angles = [];
        for (let i = 0; i < numBranches; i++) {
          let tooClose = true;

          let c = 0;

          while (tooClose) {
            tooClose = false;
            angles[i] = Math.PI * 2 * rnd();

            // Check all previous branches to see if new one is too close.
            for (let j = 0; j < i; j++) {
              let thisOneIsTooClose = Math.abs(angles[i] - angles[j]) < Math.PI / numBranches;
              tooClose = tooClose || thisOneIsTooClose;
            }
          }
        }

        // Actual looping
        for (let i = 0; i < numBranches; i++) {
          branching(
            0, 0, 
            startX, startY, 
            angles[i],
            branchLengthStart,
            branchLengthMin,
            0.01
          );
        }
      }

      // Create each individual branch of the thing
      function branching(coreX, coreY, x, y, angle, lineLength, lineLengthMin, lineWidth) {
        ctx.strokeStyle = Color([0, 255, 0]).hex();
        ctx.lineWidth = lineWidth * width;
        ctx.beginPath();
        ctx.moveTo(x * width, y * height);

        let endX = x + Math.cos(angle) * lineLength;
        let endY = y + Math.sin(angle) * lineLength;

        ctx.lineTo(
          endX * width, 
          endY * height
        );
        ctx.stroke();

        // If lineLength > .01, branch
        if (lineLength < lineLengthMin) {
          console.log('exit!')
          return;
        }

        //let branchingAngle = Math.PI / 8;
        let branchingAngle = mod1;
        branching(coreX, coreY, endX, endY, angle - branchingAngle - mod2, lineLength / 1.5, lineLengthMin, lineWidth / 1.5);
        branching(coreX, coreY, endX, endY, angle + branchingAngle - mod2, lineLength / 1.5, lineLengthMin, lineWidth / 1.5);
      }


      /*
      ctx.fillStyle = Color([rnd255(), rnd255(), rnd255()]).hex();
      ctx.fillRect(0, 0, width, height);
      
      
      function rnd255() {
        return Math.floor(255 * rnd());
      }

      /*

      ctx.clearRect(0, 0, width, height);
      block.transactions.map((tx, i) => {
        const color = Color([rnd255(), rnd255(), rnd255()]).hex();
        rect({
          ctx,
          color,
          x: width * rnd(),
          y: height * rnd(),
          width: 100 * mod1,
          height: 50 * mod2,
        });
      });

      */
      

      hoistedValue.current = 42;
    }, [canvasRef, block, mod1, mod2]);

    return (
      <canvas
        width={width}
        height={height}
        style={{ width: '100%', height: '100%' }}
        ref={canvasRef}
        {...props}
      />
    );
  }
);

export default Outer;
