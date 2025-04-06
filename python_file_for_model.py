import pandas as pd
df = pd.read_csv("Datahacks25Project/lyrics_cleaned.csv")
change_genre = {
    'Reggaetón': 'Pop',
    'Electronic': 'Pop',
    'Rap': 'Rap',
    'Hip-Hop': 'Rap',
    'Pop': 'Pop',
    'R&B': 'R&B',
    'Rock': 'Rock',
    'Soft Rock': 'Rock',
    'Alternative Rock': 'Rock',
    'Jazz': 'Pop',
    'Country': 'Rock',
    'Soul': 'R&B'
}
df['genre'] = df['genre'].map(change_genre)
df = df.rename(columns={'acutal_lyrics':'actual_lyrics'})
df = df[df['actual_lyrics'].apply(lambda x: x != '[]')].reset_index().drop(columns=['index'])
df = df.drop(columns=['Unnamed: 0'])
import re
all_lyrics = []
for song in range(df.shape[0]):
    sentence_list = list(pd.Series(re.split(r"[.,]", df.iloc[song]['actual_lyrics'][2:-2])).str.replace('"','').str.replace("'", '').str.strip())
    all_lyrics.append(sentence_list)
all_lyrics = [x for i in all_lyrics for x in i]
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.utils import pad_sequences
# Assuming you have a list of song lyrics or text data
lyrics = all_lyrics

# Initialize the tokenizer
tokenizer = Tokenizer(oov_token='<OOV>')  # oov_token handles unknown words

# Fit the tokenizer on the lyrics dataset
tokenizer.fit_on_texts(lyrics)

# Get the word index (a mapping of words to integer indices)
word_index = tokenizer.word_index

# Convert the lyrics into sequences of integers
sequences = tokenizer.texts_to_sequences(lyrics)

# Pad the sequences so that they all have the same length
max_sequence_length = max(len(seq) for seq in sequences)
sequences = pad_sequences(sequences, maxlen=max_sequence_length, padding='pre')

# Prepare X (input sequence) and y (next word)
X, y = sequences[:, :-1], sequences[:, -1]
from transformers import TFGPT2LMHeadModel, GPT2Tokenizer

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = TFGPT2LMHeadModel.from_pretrained("gpt2")

inputs = tokenizer("The quick brown fox", return_tensors="tf")
logits = model(inputs).logits

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout

# Define the model
model = Sequential()

# Add an embedding layer: maps integers (words) to dense vectors of fixed size
embedding_dim = 50  # You can adjust this size
model.add(Embedding(input_dim=len(word_index) + 1, output_dim=embedding_dim, input_length=max_sequence_length - 1))

# Add an LSTM layer: processes the sequences and learns the dependencies
model.add(LSTM(100, return_sequences=False))  # 100 LSTM units (this can be adjusted)

# Add a Dense layer to predict the next word
model.add(Dense(len(word_index) + 1, activation='softmax'))  # +1 for OOV token

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

model.fit(X, y, epochs=50, batch_size=32)

import numpy as np

def generate_lyrics_with_temperature(model, tokenizer, seed_text, max_sequence_length, n_words=5, temperature=1.0):
    # Convert the seed text into a sequence of integers
    sequence = tokenizer.texts_to_sequences([seed_text])[0]
    
    # Ensure the sequence has the correct shape (2D)
    sequence = pad_sequences([sequence], maxlen=max_sequence_length - 1, padding='pre')

    # Generate words one by one
    output = seed_text
    for _ in range(n_words):
        # Predict the next word
        pred = model.predict(sequence, verbose=0)

        # Apply temperature to the prediction probabilities
        pred = np.asarray(pred).flatten()
        pred = np.log(pred + 1e-7) / temperature  # Apply temperature scaling
        pred = np.exp(pred) / np.sum(np.exp(pred))  # Convert to probabilities again

        # Sample from the distribution
        predicted_word_index = np.random.choice(range(len(pred)), p=pred)

        # Map the index back to the word
        predicted_word = tokenizer.index_word[predicted_word_index]
        
        # Append the predicted word to the output sequence
        output += ' ' + predicted_word

        # Update the sequence to include the predicted word
        sequence = np.append(sequence, [[predicted_word_index]], axis=1)  # Add predicted word to the sequence
        sequence = sequence[:, 1:]  # Remove the first word (shifting the window)

    return output

# Example usage
seed_text = "What are those"
generated_lyrics = generate_lyrics_with_temperature(model, tokenizer, seed_text, max_sequence_length, temperature=0.7)
print(generated_lyrics)