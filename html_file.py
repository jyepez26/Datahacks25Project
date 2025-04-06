def model_function(genre,mood):
    import numpy as np
    def find_chords(genre, mood='Upbeat'):
        genres = ['Electronic', 'Rap', 'Hip-Hop', 'Pop', 'R&B', 'Rock',
            'Alternative Rock', 'Country', 'Soul']
        if genre == 'Electronic':
            if mood == 'Upbeat':
                progression = "i-III-VII-VI"
                chords = ['C# Minor: C#m, E, B, A','A Minor: Am, C, G, F']
                output_chord = np.random.choice(chords)
            if mood == 'Melancholy':
                progression = "i-VI-iv"
                chords = ['B Minor: Bm, D, F#', 'E Minor: Em, C, A']
                output_chord = np.random.choice(chords)
        if genre == 'Rap':
            if mood == 'Upbeat':
                progression == 'IV-V-vi-III'
                chords = ['C Major: F, G, Am, Em','B Major: E, F#, G#m, D#']
                output_chord = np.random.choice(chords)
            if mood == 'Melancholy':
                progression == 'i-iv-i-VI'
                chords = ['E Minor: Em, Am, Em, C','A Minor: Am, Dm, Am, F']
                output_chord = np.random.choice(chords)
        if genre == 'Hip-Hop':
            if mood == 'Upbeat':
                progression == 'IV-V-vi-III'
                chords = ['C Major: F, G, Am, Em','B Major: E, F#, G#m, D#']
                output_chord = np.random.choice(chords)
            if mood == 'Melancholy':
                progression == 'i-iv-i-VI'
                chords = ['G Minor: Gm, Cm, Gm, Eb','F Minor: Fm, Bbm, Fm, Db']
                output_chord = np.random.choice(chords)
        if genre == 'Pop':
            progression = "I-V-vi-IV"
            if mood == 'Upbeat':
                chords = ['C Major: C, G, Am, F','G Major: G, D, Em, C']
                output_chord = np.random.choice(chords)
            if mood == 'Melancholy':
                chords = ['F# Minor: F#, C#, Dm, B', 'G Minor: G, D, Ebm, C']
                output_chord = np.random.choice(chords)
        if genre == 'R&B':
            if mood == 'Upbeat':
                progression == 'ii-V-I'
                chords = ['C Major: Dm7, G7, Cmaj7','E Major: F#m7, B7, Emaj7']
                output_chord = np.random.choice(chords)
            if mood == 'Melancholy':
                progression == 'vi-IV-I-V'
                chords = ['C Major: Am, F, C, G','F Minor: Fm, Bbm, Fm, Db']
                output_chord = np.random.choice(chords)
        if genre == 'Rock':
            if mood == 'Upbeat':
                progression == 'I-IV-V'
                chords = ['C Major: C, F, G','F Major: F, Bb, C']
                output_chord = np.random.choice(chords)
            if mood == 'Melancholy':
                progression == 'I-vi-IV-V'
                chords = ['B Major: B, G#m, E, F#','Eb Major: Eb, Cm, Ab, Bb']
                output_chord = np.random.choice(chords)
        if genre == 'Alternative Rock':
            progression == 'I-V-vi-IV'
            chords = ['A Major: A, E, F#m, D','E Major: E, B, C#m, A']
            output_chord = np.random.choice(chords)
        if genre == 'Country':
            progression == 'I-IV-V'
            chords = ['F# Major: F#, B, C#','G Major: G, C, D']
            output_chord = np.random.choice(chords)
        if genre == 'Soul':
            progression == 'ii-V-I'
            chords = ['B Minor: C#m7b5, F#7, Bm7','Eb Major: Fm7, Bb7, Ebmaj7']
            output_chord = np.random.choice(chords)
        return (progression, output_chord)

    import tensorflow as tf
    import numpy as np

    model = tf.keras.models.load_model('path_to_save_model')

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
    seed_texts = ["I am like you","You are like me","Grass is the greenest",
                "I wish I had","I wish I did","I am everything","Greatness is small",
                "What is this","I can't explain","This feeling is","Why did this happen"]
    lyrics = []
    for seed in seed_texts:
        generated_lyrics = generate_lyrics_with_temperature(model, tokenizer, seed, max_sequence_length, temperature=0.7)
        lyrics.append(generated_lyrics)

    return (find_chords(genre, mood), lyrics)
