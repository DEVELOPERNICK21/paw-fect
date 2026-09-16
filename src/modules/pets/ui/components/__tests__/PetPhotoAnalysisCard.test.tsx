import React from 'react';
import renderer, { act } from 'react-test-renderer';

import type { PetPhotoAnalysis } from '../../../domain/ports/PetPhotoAnalyzer';
import { PetPhotoAnalysisCard } from '../PetPhotoAnalysisCard';

const analysis: PetPhotoAnalysis = {
  species: 'dog',
  speciesConfidence: 0.9,
  breedSuggestions: [],
  quality: 'good',
  qualityHint: 'Good for profile photo',
  lowConfidence: false,
};

describe('PetPhotoAnalysisCard', () => {
  it('shows analyzing state', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetPhotoAnalysisCard
          photoUri="file:///a.jpg"
          status="analyzing"
          onConfirm={jest.fn()}
          onSkip={jest.fn()}
        />,
      );
    });
    const texts = tree!.root
      .findAll(node => typeof node.props.children === 'string')
      .map(node => node.props.children as string);
    expect(texts.some(t => t.includes('Analyzing'))).toBe(true);
  });

  it('calls onConfirm with species only', () => {
    const onConfirm = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetPhotoAnalysisCard
          photoUri="file:///a.jpg"
          status="ready"
          analysis={analysis}
          onConfirm={onConfirm}
          onSkip={jest.fn()}
        />,
      );
    });
    const confirm = tree!.root.findByProps({
      accessibilityLabel: 'Confirm species',
    });
    act(() => {
      confirm.props.onPress();
    });
    expect(onConfirm).toHaveBeenCalledWith({ species: 'dog' });
  });

  it('calls onSkip', () => {
    const onSkip = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetPhotoAnalysisCard
          photoUri="file:///a.jpg"
          status="ready"
          analysis={analysis}
          onConfirm={jest.fn()}
          onSkip={onSkip}
        />,
      );
    });
    const skip = tree!.root.findByProps({ accessibilityLabel: 'Skip' });
    act(() => {
      skip.props.onPress();
    });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows low confidence warning', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetPhotoAnalysisCard
          photoUri="file:///a.jpg"
          status="ready"
          analysis={{ ...analysis, lowConfidence: true }}
          onConfirm={jest.fn()}
          onSkip={jest.fn()}
        />,
      );
    });
    const texts = tree!.root
      .findAll(node => typeof node.props.children === 'string')
      .map(node => node.props.children as string);
    expect(texts.some(t => t.includes('Not sure'))).toBe(true);
  });
});
