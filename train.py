#Importing libraries
import tensorflow as tf
import matplotlib.pyplot as plt
import pandas as pd


#importing dataset
BASE_DIR = "data/local_food_dataset"

print("Train exists:", os.path.exists(f"{BASE_DIR}/train"))
print("Valid exists:", os.path.exists(f"{BASE_DIR}/valid"))

#Data preprocessing
training_set = tf.keras.utils.image_dataset_from_directory(
'#path of the training directory ' ,
labels="inferred",
label_mode ="categorical",
class_names=None,
color_mode="rgb",
batch_size=32,
image_size=(128,128),
shuffle=True,
seed=None,
validation_split=None,
subset=None,
interpolation="bilinear",
follow_links= False,   
crop_to_aspect_ratio=False)      

#Validation image processing
validation_set = tf.keras.utils.image_dataset_from_directory(
'#path of the validation directory',
labels="inferred",
label_mode ="categorical",
class_names=None,
color_mode="rgb",
batch_size=32,
image_size=(128,128),
shuffle=True,
seed=None,
validation_split=None,
subset=None,)

#Model building
model = tf.keras.Sequential

#building convolutional layers
cnn.add(tf.keras.layers.Conv2D(1./255, input_shape=(64,64, 3)))
cnn.add(tf.keras.layers.Conv2D(32, (3, 3), activation='relu'))
cnn.add(tf.keras.layers.MaxPooling2D((2, 2)))

cnn.add(tf.keras.layers.Conv2D(64, (3, 3), activation='relu'))
cnn.add(tf.keras.layers.MaxPooling2D((2, 2)))
training_history = model.fit(training_set,validation_data=validation_set,epochs=20)
#Saving model
cnn.save("zimfoodkidney.h5)")

training_history_df = pd.DataFrame(training_history.history)

#Recording history
import json 
with open('training_history.json', 'w') as f:
    json.dump(training_history.history, f)()
    print("Training history saved to training_history.json")