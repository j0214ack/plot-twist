export interface AccessGatedFramePolicyInput {
  sessionReady: boolean;
  initialWorldFrameRendered: boolean;
}

export interface AccessGatedFramePolicy {
  advanceWorld: boolean;
  renderWorld: boolean;
  updateHud: boolean;
}

export const resolveAccessGatedFramePolicy = ({
  sessionReady,
  initialWorldFrameRendered,
}: AccessGatedFramePolicyInput): AccessGatedFramePolicy => {
  if (sessionReady) {
    return {
      advanceWorld: true,
      renderWorld: true,
      updateHud: true,
    };
  }

  const needsBootstrapFrame = !initialWorldFrameRendered;
  return {
    advanceWorld: false,
    renderWorld: needsBootstrapFrame,
    updateHud: needsBootstrapFrame,
  };
};
