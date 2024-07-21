export default class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
      this.score = 0; // Initialize the score in the constructor
    }
  
    preload() {
      this.load.image('bird', 'assets/images/bird.png');
      this.load.image('pig', 'assets/images/pig.png');
      this.load.image('slingshot', 'assets/images/slingshot.png');
      // this.load.image('structure', 'assets/images/structure.png');
    }
  
    create() {
      // Calculate scale factor based on screen dimensions
      const scaleFactor = Math.min(window.innerWidth / 800, window.innerHeight / 600);
      this.scalingFactor = scaleFactor
  
      // Define collision categories as class properties
      this.birdCategory = this.matter.world.nextCategory();
      this.slingshotCategory = this.matter.world.nextCategory();
      this.pigCategory = this.matter.world.nextCategory();
      // this.structureCategory = this.matter.world.nextCategory();
  
      // Add slingshot
      this.slingshot = this.matter.add.image(200 * scaleFactor, 450 * scaleFactor, 'slingshot');
      this.slingshot.setScale(scaleFactor);
      this.slingshot.setStatic(true);
      this.slingshot.setCollisionCategory(this.slingshotCategory);
  
      // Add bird
      this.bird = this.matter.add.image(150 * scaleFactor, 450 * scaleFactor, 'bird');
      this.bird.setScale(0.5 * scaleFactor); // Scale the bird down to 50% of its original size
      this.bird.setCircle((this.bird.width / 2) * 0.5 * scaleFactor); // Adjust physics body to match the scaled size
      this.bird.setStatic(true); // Set the bird as static initially
      this.bird.setInteractive();
      this.bird.setCollisionCategory(this.birdCategory);
      this.bird.setCollidesWith([this.pigCategory /*, this.structureCategory */]);
  
      this.input.setDraggable(this.bird);
  
      // Add drag event for bird
      this.input.on('dragstart', (pointer, gameObject) => {
        this.matter.world.engine.positionIterations = 30;
        this.matter.world.engine.velocityIterations = 30;
      });
  
      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.setPosition(dragX, dragY);
      });
  
      this.input.on('dragend', (pointer, gameObject) => {
        this.matter.world.engine.positionIterations = 6;
        this.matter.world.engine.velocityIterations = 4;
  
        // Make the bird dynamic and calculate velocity based on drag distance
        gameObject.setStatic(false);
        const velocityX = (150 * scaleFactor - gameObject.x) / 8;
        const velocityY = (450 * scaleFactor - gameObject.y) / 8;
        gameObject.setVelocity(velocityX, velocityY);
      });
  
      // Initialize pigs array
      this.pigs = [];
  
      // Spawn initial pigs
      this.spawnPig(scaleFactor);
      this.spawnPig(scaleFactor);
      this.spawnPig(scaleFactor);
  
      // Add collision event listener
      this.matter.world.on('collisionstart', (event) => {
        const pairs = event.pairs;
  
        for (let i = 0; i < pairs.length; i++) {
          const pair = pairs[i];
          const { bodyA, bodyB } = pair;
  
          // Check if the bird is involved in the collision
          if (
            (bodyA.gameObject === this.bird && this.pigs.includes(bodyB.gameObject)) ||
            (bodyB.gameObject === this.bird && this.pigs.includes(bodyA.gameObject))
          ) {
            const pig = bodyA.gameObject === this.bird ? bodyB.gameObject : bodyA.gameObject;
            this.handleBirdPigCollision(pig, scaleFactor);
          }
        }
      });
  
      // Create score text
      this.scoreText = this.add.text(16 * scaleFactor, 16 * scaleFactor, 'Score: ' + this.score, { fontSize: 32 * scaleFactor + 'px', fill: '#fff' });
    }
  
    handleBirdPigCollision(pig, scaleFactor) {
      // Actions to perform when the bird collides with the pig
      console.log('Bird collided with Pig!');
      // Destroy the pig
      pig.destroy();
      // Remove the pig from the array
      this.pigs = this.pigs.filter(p => p !== pig);
      // Update score
      this.score += 10;
      this.scoreText.setText('Score: ' + this.score);
  
      // Respawn a new pig
      this.spawnPig(scaleFactor);
  
      // Reset the bird's position and state
      this.resetBird(scaleFactor);
    }
  
    resetBird(scaleFactor) {
      this.bird.setPosition(150 * scaleFactor, 450 * scaleFactor);
      this.bird.setStatic(true); // Make the bird static again
    }
  
    spawnPig(scaleFactor) {
      const x = Phaser.Math.Between(400 * scaleFactor, 800 * scaleFactor); // Random x position within the game width
      const y = Phaser.Math.Between(200 * scaleFactor, 600 * scaleFactor); // Random y position within the game height
  
      const pig = this.matter.add.image(x, y, 'pig');
      pig.setScale(0.7 * scaleFactor); // Scale the pig to 70% of its original size
      pig.setCircle((pig.width / 2) * 0.7 * scaleFactor); // Adjust physics body to match the scaled size
      pig.setBounce(1); // Make pigs bounce
      pig.setFrictionAir(0); // No air friction for continuous movement
      pig.setVelocity(Phaser.Math.Between(-2, 2), Phaser.Math.Between(-2, 2)); // Random initial velocity
      pig.setCollisionCategory(this.pigCategory);
      this.pigs.push(pig);
    }
  
    update() {
      // Game logic for win/lose conditions and scoring
      const birdBounds = this.bird.getBounds();
      const birdWidth = this.bird.width / 2;
      const birdHeight = this.bird.height / 2;
  
      if (birdBounds.right < 0 || birdBounds.left > this.scale.width || birdBounds.top > this.scale.height) {
        this.resetBird(this.scalingFactor);
        this.score -= 10;
      this.scoreText.setText('Score: ' + this.score);
      }
  
      // Keep pigs within bounds and handle edge collisions
      this.pigs.forEach(pig => {
        const pigWidth = pig.width / 2;
        const pigHeight = pig.height / 2;
  
        if (pig.x - pigWidth < 0) {
          pig.setVelocityX(Math.abs(pig.body.velocity.x)); // Move right
        } else if (pig.x + pigWidth > this.scale.width) {
          pig.setVelocityX(-Math.abs(pig.body.velocity.x)); // Move left
        }
        if (pig.y - pigHeight < 0) {
          pig.setVelocityY(Math.abs(pig.body.velocity.y)); // Move down
        } else if (pig.y + pigHeight > this.scale.height) {
            pig.y = this.scale.height - pigHeight;
          pig.setVelocityY(-Math.abs(pig.body.velocity.y)); // Move up
        }
      });
    }
  }
  